import {
  Token as TokenSDK,
  FixedPointNumber,
  forceToCurrencyId,
  forceToCurrencyName,
  createDexShareName,
  getCurrencyObject
} from "@acala-network/sdk-core"
import {
  AccountId,
  Balance,
  CurrencyId,
  Position,
  TradingPair,
} from "@acala-network/types/interfaces"
import dayjs from "dayjs"
import { Pool } from "../../types/models"
import { getPrice } from "../prices"
import { getToken } from "../tokens"
import { EventHandler } from "../types"
import { add, getPoolId, minus } from "../utils"
import { getDex } from "./dex"
import { updatePoolDayData, updatePoolHourData, updatePool15MnData, updatePool1MnData, updatePoolBlockData } from "./pool-interval"

export async function getPool(a: string, b: string) {
  const [token0, token1] = TokenSDK.sortTokenNames(a, b)
  const poolName = createDexShareName(token0, token1)

  let record = await Pool.get(poolName)

  if (!record) {
    record = new Pool(poolName)

    // query the old data
    const position = await api.query.dex.liquidityPool([getCurrencyObject(token0), getCurrencyObject(token1)]) as unknown as Position;

    record.token0Id = token0
    record.token1Id = token1
    record.token0Amount = position?.[0].toString() || '0'
    record.token1Amount = position?.[1].toString() || '0'
    record.txCount = BigInt(0)
    record.fee = '3000000000000000'

    await record.save()
  }

  return record
}

export const createDexPool: EventHandler = async ({ rawEvent, event }) => {
  // [trading_pair, pool_0_amount, pool_1_amount, total_share_amount\]
  const [tradingPair, token0Amount, token1Amount] = rawEvent.event.data as unknown as [TradingPair, Balance, Balance, Balance]

  const token0Name = forceToCurrencyName(tradingPair[0])
  const token1Name = forceToCurrencyName(tradingPair[1])

  const token0Record = await getToken(token0Name)
  const token1Record = await getToken(token1Name)
  const timestamp = dayjs(event.timestamp).unix()

  const pool = await getPool(token0Name, token1Name)
  const dex = await getDex()

  const _token0Amount = FixedPointNumber.fromInner(token0Amount.toString(), token0Record.decimal)
  const _token1Amount = FixedPointNumber.fromInner(token1Amount.toString(), token1Record.decimal)

  // reflash all related tokens price
  const token0Price = await getPrice(token0Record.name)
  const token1Price = await getPrice(token1Record.name)

  token0Record.price = token0Price.toChainData()
  token1Record.price = token1Price.toChainData()

  await token0Record.save()
  await token1Record.save()

	const exchangeFee = api.consts.dex.getExchangeFee
  pool.token0Amount = _token0Amount.toChainData()
  pool.token1Amount = _token1Amount.toChainData()
  pool.exchange0 = _token1Amount.div(_token0Amount).toChainData()
  pool.exchange1 = _token0Amount.div(_token1Amount).toChainData()

  const token0TVL = _token0Amount.times(token0Price)
  const token1TVL = _token1Amount.times(token1Price)
  const totalTVL = token0TVL.add(token1TVL)

  // modify pricision
  token0TVL.setPrecision(18)
  token1TVL.setPrecision(18)
  totalTVL.setPrecision(18)

  // the swap volume is 0 at the pool created
  pool.token0Volume = "0"
  pool.token1Volume = "0"
  pool.volumeUSD = "0"

	pool.fee = FixedPointNumber.fromInner(exchangeFee[0].toString()).div(FixedPointNumber.fromInner(exchangeFee[1].toString())).toChainData()

  pool.token0TVL = token0TVL.toChainData()
  pool.token1TVL = token1TVL.toChainData()
  pool.tvlUSD = totalTVL.toChainData()

  dex.totalTVLUSD = add(dex.totalTVLUSD, pool.tvlUSD).toChainData()
  dex.poolCount = dex.poolCount + 1

  await pool.save()
  await dex.save()

  const blockRecord = await updatePoolBlockData(token0Name, token1Name, timestamp)
  const mn1Record = await updatePool1MnData(token0Name, token1Name, timestamp)
  const mn15Record = await updatePool15MnData(token0Name, token1Name, timestamp)
  const hourRecord = await updatePoolHourData(token0Name, token1Name, timestamp)
  const dayRecord = await updatePoolDayData(token0Name, token1Name, timestamp)

  await blockRecord.save()
	await mn1Record.save()
  await hourRecord.save()
  await mn15Record.save()
	await dayRecord.save()
}

export const updatePoolByAddLiquidity: EventHandler = async ({
  rawEvent,
  event,
}) => {
  // [who, currency_id_0, pool_0_increment, currency_id_1, pool_1_increment, share_increment\]
  const [, currency0, pool0Increment, currency1, pool1Increment] = rawEvent
    .event.data as unknown as [
    AccountId,
    CurrencyId,
    Balance,
    CurrencyId,
    Balance
  ]

  const [, token0Name, token1Name] = getPoolId(currency0, currency1)
  const token0Increment = (token0Name === forceToCurrencyName(currency0) ? pool0Increment : pool1Increment).toString()
  const token1Increment = (token1Name === forceToCurrencyName(currency0) ? pool0Increment : pool1Increment).toString()

  const token0Record = await getToken(token0Name)
  const token1Record = await getToken(token1Name)
  const timestamp = dayjs(event.timestamp).unix()

  const pool = await getPool(token0Name, token1Name)
  const dex = await getDex()

  const token0Price = await getPrice(token0Name)
  const token1Price = await getPrice(token1Name)

  const token0Amount = add(pool.token0Amount, token0Increment)
  const token1Amount = add(pool.token1Amount, token1Increment)

  pool.token0Amount = token0Amount.toChainData()
  pool.token1Amount = token1Amount.toChainData()

  await pool.save()

  // update token0Amount, token1Amount decimals for calculate
  token0Amount.forceSetPrecision(token0Record.decimal)
  token1Amount.forceSetPrecision(token1Record.decimal)

  // reflash token information
  token0Record.price = (await getPrice(token0Name)).toChainData()
  token1Record.price = (await getPrice(token1Name)).toChainData()

  token0Record.price = token0Price.toChainData()
  token1Record.price = token1Price.toChainData()
  token0Record.lockedInDex = add(token0Record.lockedInDex, token0Increment).toChainData()
  token1Record.lockedInDex = add(token1Record.lockedInDex, token1Increment).toChainData()

  await token0Record.save()
  await token1Record.save()

  // calculate token info
  const prevTVL = pool.tvlUSD

  const token0TVL = token0Amount.times(token0Price)
  const token1TVL = token1Amount.times(token1Price)
  const totalTVL = token0TVL.add(token1TVL)

  // modify tvl pricesion to 18
  totalTVL.setPrecision(18)
  token0TVL.setPrecision(18)
  token1TVL.setPrecision(18)

  pool.token0TVL = token0TVL.toChainData()
  pool.token1TVL = token1TVL.toChainData()
  pool.tvlUSD = totalTVL.toChainData()
  pool.txCount = pool.txCount + BigInt(1)

  const tvlChanged = totalTVL.minus(FixedPointNumber.fromInner(prevTVL))

  dex.totalTVLUSD = add(dex.totalTVLUSD, tvlChanged).toChainData()

  await pool.save()
  await dex.save()

  const blockRecord = await updatePoolBlockData(token0Name, token1Name, timestamp)
  const mn1Record = await updatePool1MnData(token0Name, token1Name, timestamp)
  const mn15Record = await updatePool15MnData(token0Name, token1Name, timestamp)
  const hourRecord = await updatePoolHourData(token0Name, token1Name, timestamp)
  const dayRecord = await updatePoolDayData(token0Name, token1Name, timestamp)

  await blockRecord.save()
	await mn1Record.save()
  await hourRecord.save()
  await mn15Record.save()
	await dayRecord.save()
}

export const updatePoolByRemoveLiquidity: EventHandler = async ({
  rawEvent,
  event,
}) => {
  // [who, currency_id_0, pool_0_decrement, currency_id_1, pool_1_decrement, share_decrement\]
  const [, currency0, pool0Decrement, currency1, pool1Decrement] = rawEvent
    .event.data as unknown as [
    AccountId,
    CurrencyId,
    Balance,
    CurrencyId,
    Balance
  ]

  const [, token0Name, token1Name] = getPoolId(currency0, currency1)
  const token0Decrement = (token0Name === forceToCurrencyName(currency0) ? pool0Decrement : pool1Decrement).toString()
  const token1Decrement = (token1Name === forceToCurrencyName(currency0) ? pool0Decrement : pool1Decrement).toString()

  const token0Record = await getToken(token0Name)
  const token1Record = await getToken(token1Name)
  const timestamp = dayjs(event.timestamp).unix()

  const pool = await getPool(token0Name, token1Name)
  const dex = await getDex()

  const token0Price = await getPrice(token0Name)
  const token1Price = await getPrice(token1Name)

  const token0Amount = minus(pool.token0Amount, token0Decrement)
  const token1Amount = minus(pool.token1Amount, token1Decrement)

  pool.token0Amount = token0Amount.toChainData()
  pool.token1Amount = token1Amount.toChainData()

  // update token0Amount, token1Amount decimals for calculate
  token0Amount.forceSetPrecision(token0Record.decimal)
  token1Amount.forceSetPrecision(token1Record.decimal)

  token0Record.price = token0Price.toChainData()
  token1Record.price = token1Price.toChainData()

  token0Record.lockedInDex = minus(token0Record.lockedInDex, token0Decrement).toChainData()
  token1Record.lockedInDex = minus(token1Record.lockedInDex, token1Decrement).toChainData()

  await token0Record.save()
  await token1Record.save()

  const prevTVL = FixedPointNumber.fromInner(pool.tvlUSD)
  const token0TVL = token0Amount.times(token0Price)
  const token1TVL = token1Amount.times(token1Price)
  const totalTVL = token0TVL.add(token1TVL)

  token0TVL.setPrecision(18)
  token1TVL.setPrecision(18)
  totalTVL.setPrecision(18)

  pool.token0TVL = token0TVL.toChainData()
  pool.token1TVL = token1TVL.toChainData()
  pool.tvlUSD = totalTVL.toChainData()
  pool.txCount = pool.txCount + BigInt(1)

  const tvlChanged = totalTVL.minus(prevTVL)

  dex.totalTVLUSD = add(dex.totalTVLUSD, tvlChanged).toChainData()

  await pool.save()
  await dex.save()

  const blockRecord = await updatePoolBlockData(token0Name, token1Name, timestamp)
  const mn1Record = await updatePool1MnData(token0Name, token1Name, timestamp)
  const mn15Record = await updatePool15MnData(token0Name, token1Name, timestamp)
  const hourRecord = await updatePoolHourData(token0Name, token1Name, timestamp)
  const dayRecord = await updatePoolDayData(token0Name, token1Name, timestamp)

  await blockRecord.save()
	await mn1Record.save()
  await hourRecord.save()
  await mn15Record.save()
	await dayRecord.save()
}

export const updatePoolBySwap: EventHandler = async ({ rawEvent, event }) => {
  const runtimeVersion = Number(rawEvent.block.specVersion.toString());

  if (runtimeVersion >= 1008) {
    await updatePoolBySwapNew({ rawEvent, event });

    return;
  }

  // [trader, trading_path, supply_currency_amount, target_currency_amount\]
  const [, tradingPath, supplyAmount, targetAmount] = rawEvent.event
    .data as unknown as [AccountId, CurrencyId[], Balance, Balance]

	let nextSupplyAmount = FixedPointNumber.ZERO

  for (let i = 0; i < tradingPath.length - 1; i++) {
    const currency0 = tradingPath[i]
    const currency1 = tradingPath[i + 1]

		const supplyTokenName = forceToCurrencyName(currency0)
		const targetTokenName = forceToCurrencyName(currency1)

    const [, token0Name, token1Name] = getPoolId(currency0, currency1)
    const token0Record = await getToken(token0Name)
    const token1Record = await getToken(token1Name)
    const pool = await getPool(token0Name, token1Name)
    const dex = await getDex()
    const timestamp = dayjs(event.timestamp).unix()

		let token0Balance = '0'
		let token1Balance = '0'

		if (tradingPath.length === 2) {
			token0Balance = token0Name === supplyTokenName ? supplyAmount.toString() : '-' + targetAmount.toString()
			token1Balance = token1Name === supplyTokenName ? supplyAmount.toString() : '-' + targetAmount.toString()
		} else {
			// calculate
			const supplyPool = FixedPointNumber.fromInner(token0Name === supplyTokenName ? pool.token0Amount : pool.token1Amount)
			const targetPool = FixedPointNumber.fromInner(token0Name === targetTokenName ? pool.token0Amount : pool.token1Amount)

			const _supplyAmount = i === 0 ? FixedPointNumber.fromInner(supplyAmount.toString()) : nextSupplyAmount

			const targetAmount = targetPool.minus(
        supplyPool.times(targetPool)
          .div(supplyPool.add((_supplyAmount.times(FixedPointNumber.ONE.minus(FixedPointNumber.fromInner(pool.fee))))))
      ) 

      // update next supply amount
      nextSupplyAmount = targetAmount

			token0Balance = pool.token0Id === supplyTokenName ? _supplyAmount.toChainData() : '-' + targetAmount.toChainData()
			token1Balance = pool.token1Id === supplyTokenName ? _supplyAmount.toChainData() : '-' + targetAmount.toChainData()
		}

    const token0Price = await getPrice(token0Record.name)
    const token1Price = await getPrice(token1Record.name)
    const token0Decimal = token0Record.decimal
    const token1Decimal = token1Record.decimal

    const token0Amount = add(pool.token0Amount, token0Balance, token0Decimal, token0Decimal)
    const token1Amount = add(pool.token1Amount, token1Balance, token1Decimal, token1Decimal)

		const token0Changed = FixedPointNumber.fromInner(token0Balance, token0Decimal).abs()
		const token1Changed = FixedPointNumber.fromInner(token1Balance, token1Decimal).abs()

    // set exchange first
    pool.exchange0 = token1Amount.div(token0Amount).toChainData()
    pool.exchange1 = token0Amount.div(token1Amount).toChainData()


    const token0TVL = token0Amount.times(token0Price)
    const token1TVL = token1Amount.times(token1Price)
    const totalTVL = token0TVL.add(token1TVL)

		const token0VolumeUSD = token0Changed.times(token0Price)
		const token1VolumeUSD = token1Changed.times(token1Price)
		const totalVolumeUSD = token0VolumeUSD.add(token1VolumeUSD).times(new FixedPointNumber(0.5))

    token0TVL.setPrecision(18)
    token1TVL.setPrecision(18)
    totalTVL.setPrecision(18)
    token0VolumeUSD.setPrecision(18)
    token1VolumeUSD.setPrecision(18)
    totalVolumeUSD.setPrecision(18)

    // update token data
    token0Record.price = token0Price.toChainData()
    token1Record.price = token1Price.toChainData()
    token0Record.lockedInDex = add(token0Record.lockedInDex, token0Balance, token0Decimal, token0Decimal).toChainData()
    token1Record.lockedInDex = add(token1Record.lockedInDex, token1Balance, token1Decimal, token1Decimal).toChainData()
    token0Record.volume = add(token0Record.volume, token0Changed, token0Decimal, token0Decimal).toChainData()
    token1Record.volume = add(token1Record.volume, token1Changed, token1Decimal, token1Decimal).toChainData()
    token0Record.volumeUSD = add(token0Record.volumeUSD, token0VolumeUSD).toChainData()
    token1Record.volumeUSD = add(token1Record.volumeUSD, token1VolumeUSD).toChainData()
    token0Record.txCount = token0Record.txCount + BigInt(1)
    token1Record.txCount = token0Record.txCount + BigInt(1)

    await token0Record.save()
    await token1Record.save()

    const prevTVL = pool.tvlUSD

    pool.token0Amount = token0Amount.toChainData()
    pool.token1Amount = token1Amount.toChainData()
    pool.token0TVL = token0TVL.toChainData()
    pool.token1TVL = token1TVL.toChainData()
    pool.tvlUSD = totalTVL.toChainData()
		pool.token0Volume = add(pool.token0Volume, token0Changed).toChainData()
		pool.token1Volume = add(pool.token1Volume, token1Changed).toChainData()
		pool.volumeUSD = add(pool.volumeUSD, totalVolumeUSD).toChainData()

    dex.totalTVLUSD = add(minus(pool.tvlUSD, prevTVL), dex.totalTVLUSD).toChainData()

    await pool.save()
    await dex.save()

    const blockRecord = await updatePoolBlockData(token0Name, token1Name, timestamp)
    const mn1Record = await updatePool1MnData(token0Name, token1Name, timestamp)
    const mn15Record = await updatePool15MnData(token0Name, token1Name, timestamp)
    const hourRecord = await updatePoolHourData(token0Name, token1Name, timestamp)
    const dayRecord = await updatePoolDayData(token0Name, token1Name, timestamp)
  
    mn1Record.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
    mn15Record.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
    blockRecord.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
		hourRecord.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
		dayRecord.volumeUSD = add(dayRecord.volumeUSD, totalVolumeUSD).toChainData()

    await blockRecord.save()
    await mn1Record.save()
    await hourRecord.save()
    await mn15Record.save()
    await dayRecord.save()

  }

}

export const updatePoolBySwapNew: EventHandler = async ({ rawEvent, event }) => {
  // [trader, trading_path, supply_currency_amount, target_currency_amount\]
  const [who, tradingPath, resultPath] = rawEvent.event
    .data as unknown as [AccountId, CurrencyId[], Balance[]]
  

	let nextSupplyAmount = FixedPointNumber.ZERO

  for (let i = 0; i < tradingPath.length - 1; i++) {
    const currency0 = tradingPath[i]
    const currency1 = tradingPath[i + 1]
    const result0 = resultPath[i]
    const result1 = resultPath[i + 1]

		const supplyTokenName = forceToCurrencyName(currency0)
		const targetTokenName = forceToCurrencyName(currency1)

    const [, token0Name, token1Name] = getPoolId(currency0, currency1)
    const token0Record = await getToken(token0Name)
    const token1Record = await getToken(token1Name)
    const pool = await getPool(token0Name, token1Name)
    const dex = await getDex()
    const timestamp = dayjs(event.timestamp).unix()

    const token0Balance = token0Name === supplyTokenName ? result0.toString() : '-' + result1.toString()
    const token1Balance = token1Name === supplyTokenName ? result0.toString() : '-' + result1.toString()

    const token0Price = await getPrice(token0Record.name)
    const token1Price = await getPrice(token1Record.name)
    const token0Decimal = token0Record.decimal
    const token1Decimal = token1Record.decimal

    const token0Amount = add(pool.token0Amount, token0Balance, token0Decimal, token0Decimal)
    const token1Amount = add(pool.token1Amount, token1Balance, token1Decimal, token1Decimal)

		const token0Changed = FixedPointNumber.fromInner(token0Balance, token0Decimal).abs()
		const token1Changed = FixedPointNumber.fromInner(token1Balance, token1Decimal).abs()

    // set exchange first
    pool.exchange0 = token1Amount.div(token0Amount).toChainData()
    pool.exchange1 = token0Amount.div(token1Amount).toChainData()


    const token0TVL = token0Amount.times(token0Price)
    const token1TVL = token1Amount.times(token1Price)
    const totalTVL = token0TVL.add(token1TVL)

		const token0VolumeUSD = token0Changed.times(token0Price)
		const token1VolumeUSD = token1Changed.times(token1Price)
		const totalVolumeUSD = token0VolumeUSD.add(token1VolumeUSD).times(new FixedPointNumber(0.5))

    token0TVL.setPrecision(18)
    token1TVL.setPrecision(18)
    totalTVL.setPrecision(18)
    token0VolumeUSD.setPrecision(18)
    token1VolumeUSD.setPrecision(18)
    totalVolumeUSD.setPrecision(18)

    // update token data
    token0Record.price = token0Price.toChainData()
    token1Record.price = token1Price.toChainData()
    token0Record.lockedInDex = add(token0Record.lockedInDex, token0Balance, token0Decimal, token0Decimal).toChainData()
    token1Record.lockedInDex = add(token1Record.lockedInDex, token1Balance, token1Decimal, token1Decimal).toChainData()
    token0Record.volume = add(token0Record.volume, token0Changed, token0Decimal, token0Decimal).toChainData()
    token1Record.volume = add(token1Record.volume, token1Changed, token1Decimal, token1Decimal).toChainData()
    token0Record.volumeUSD = add(token0Record.volumeUSD, token0VolumeUSD).toChainData()
    token1Record.volumeUSD = add(token1Record.volumeUSD, token1VolumeUSD).toChainData()
    token0Record.txCount = token0Record.txCount + BigInt(1)
    token1Record.txCount = token0Record.txCount + BigInt(1)

    await token0Record.save()
    await token1Record.save()

    const prevTVL = pool.tvlUSD

    pool.token0Amount = token0Amount.toChainData()
    pool.token1Amount = token1Amount.toChainData()
    pool.token0TVL = token0TVL.toChainData()
    pool.token1TVL = token1TVL.toChainData()
    pool.tvlUSD = totalTVL.toChainData()
		pool.token0Volume = add(pool.token0Volume, token0Changed).toChainData()
		pool.token1Volume = add(pool.token1Volume, token1Changed).toChainData()
		pool.volumeUSD = add(pool.volumeUSD, totalVolumeUSD).toChainData()

    dex.totalTVLUSD = add(minus(pool.tvlUSD, prevTVL), dex.totalTVLUSD).toChainData()

    await pool.save()
    await dex.save()

    const blockRecord = await updatePoolBlockData(token0Name, token1Name, timestamp)
    const mn1Record = await updatePool1MnData(token0Name, token1Name, timestamp)
    const mn15Record = await updatePool15MnData(token0Name, token1Name, timestamp)
    const hourRecord = await updatePoolHourData(token0Name, token1Name, timestamp)
    const dayRecord = await updatePoolDayData(token0Name, token1Name, timestamp)
  
    mn1Record.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
    mn15Record.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
    blockRecord.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
		hourRecord.volumeUSD = add(hourRecord.volumeUSD, totalVolumeUSD).toChainData()
		dayRecord.volumeUSD = add(dayRecord.volumeUSD, totalVolumeUSD).toChainData()

    await blockRecord.save()
    await mn1Record.save()
    await hourRecord.save()
    await mn15Record.save()
    await dayRecord.save()


  }
}
