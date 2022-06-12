import { MaybeCurrency } from "@acala-network/sdk-core"
import dayjs from "dayjs"
import { PoolDayData, PoolHourData, Pool15MnData, Pool1MnData, PoolBlockData } from "../../types/models"
import { getToken } from "../tokens"
import { getPoolId } from "../utils"
import { getPool } from "./pool"

function calculate(str) {
	return Function(`'use strict'; return (${str})`)()
}
  
export const updatePoolHourData = async (tokenA: MaybeCurrency, tokenB: MaybeCurrency, timestamp: number, blockNumber: bigint) => {
	const [poolId, token0Name, token1Name] = getPoolId(tokenA, tokenB)
	const hourIndex = Math.ceil(timestamp / 3600)
	const recordId = `${poolId}-${hourIndex}`

	await getToken(token0Name)
	await getToken(token1Name)
	await getToken(poolId)

	let record = await PoolHourData.get(recordId)
	const poolRecord = await getPool(token0Name, token1Name)

	if (!record) {
		record = new PoolHourData(recordId)

		record.poolId = poolId
		record.date = dayjs.unix(hourIndex * 3600).toDate()
		//record.blockNumber = [blockNumber]
		record.token0Id = token0Name
		record.token1Id = token1Name

		record.volumeToken0 = '0'
		record.volumeToken1 = '0'
		record.volumeUSD = '0'
		record.txCount = BigInt(0)
		
		record.rateToken0Token1High = '0'
		record.rateToken0Token1Low = '999999'
		record.rateToken0Token1Open = null
		record.rateToken0Token1Close = null
		record.rateToken1Token0High = '0'
		record.rateToken1Token0Low = '999999'
		record.rateToken1Token0Open = null
		record.rateToken1Token0Close = null
		
		await record.save()
	}

	// update data
	//record.blockNumber.push(blockNumber)
	record.token0Amount = poolRecord.token0Amount
	record.token1Amount = poolRecord.token1Amount
	 
	record.rateToken0Token1 = calculate(poolRecord.token0Amount+"/"+poolRecord.token1Amount)
  	record.rateToken0Token1High = (record.rateToken0Token1 > record.rateToken0Token1High) ? record.rateToken0Token1 : record.rateToken0Token1High
  	record.rateToken0Token1Low = (record.rateToken0Token1 < record.rateToken0Token1Low) ? record.rateToken0Token1 : record.rateToken0Token1Low
  	record.rateToken0Token1Open = (record.rateToken0Token1Open == null) ? record.rateToken0Token1 : record.rateToken0Token1Open
	record.rateToken0Token1Close = record.rateToken0Token1
	record.rateToken1Token0 = calculate(poolRecord.token1Amount+"/"+poolRecord.token0Amount)
  	record.rateToken1Token0High = (record.rateToken1Token0 > record.rateToken1Token0High) ? record.rateToken1Token0 : record.rateToken1Token0High
  	record.rateToken1Token0Low = (record.rateToken1Token0 < record.rateToken1Token0Low) ? record.rateToken1Token0 : record.rateToken1Token0Low
	record.rateToken1Token0Open = (record.rateToken1Token0Open == null) ? record.rateToken1Token0 : record.rateToken1Token0Open
	record.rateToken1Token0Close = record.rateToken1Token0
	
	record.exchange0 = poolRecord.exchange0
	record.exchange1 = poolRecord.exchange1
	record.tvlUSD = poolRecord.tvlUSD

	record.txCount = record.txCount + BigInt(1)

	return record
}

export const updatePool15MnData = async (tokenA: MaybeCurrency, tokenB: MaybeCurrency, timestamp: number, blockNumber: bigint) => {
	const [poolId, token0Name, token1Name] = getPoolId(tokenA, tokenB)
	const hourIndex = Math.ceil(timestamp / 900)
	const recordId = `${poolId}-${hourIndex}`

	await getToken(token0Name)
	await getToken(token1Name)
	await getToken(poolId)

	let record = await Pool15MnData.get(recordId)

	const poolRecord = await getPool(token0Name, token1Name)

	if (!record) {

		record = new Pool15MnData(recordId)

		record.poolId = poolId
		record.date = dayjs.unix(hourIndex * 900).toDate()

		//record.blockNumber = [blockNumber]

		record.token0Id = token0Name
		record.token1Id = token1Name

		record.volumeToken0 = '0'
		record.volumeToken1 = '0'
		record.volumeUSD = '0'
		record.txCount = BigInt(0)
		
		record.rateToken0Token1High = '0'
		record.rateToken0Token1Low = '999999'
		record.rateToken0Token1Open = null
		record.rateToken0Token1Close = null
		record.rateToken1Token0High = '0'
		record.rateToken1Token0Low = '999999'
		record.rateToken1Token0Open = null
		record.rateToken1Token0Close = null
		
		await record.save()
	}

	// update data
	//record.blockNumber.push(blockNumber)
	record.token0Amount = poolRecord.token0Amount
	record.token1Amount = poolRecord.token1Amount
	 
	// Arno
	record.rateToken0Token1 = calculate(poolRecord.token0Amount+"/"+poolRecord.token1Amount)
  	record.rateToken0Token1High = (record.rateToken0Token1 > record.rateToken0Token1High) ? record.rateToken0Token1 : record.rateToken0Token1High
  	record.rateToken0Token1Low = (record.rateToken0Token1 < record.rateToken0Token1Low) ? record.rateToken0Token1 : record.rateToken0Token1Low
  	record.rateToken0Token1Open = (record.rateToken0Token1Open == null) ? record.rateToken0Token1 : record.rateToken0Token1Open
	record.rateToken0Token1Close = record.rateToken0Token1
	record.rateToken1Token0 = calculate(poolRecord.token1Amount+"/"+poolRecord.token0Amount)
  	record.rateToken1Token0High = (record.rateToken1Token0 > record.rateToken1Token0High) ? record.rateToken1Token0 : record.rateToken1Token0High
  	record.rateToken1Token0Low = (record.rateToken1Token0 < record.rateToken1Token0Low) ? record.rateToken1Token0 : record.rateToken1Token0Low
	record.rateToken1Token0Open = (record.rateToken1Token0Open == null) ? record.rateToken1Token0 : record.rateToken1Token0Open
	record.rateToken1Token0Close = record.rateToken1Token0
	
	record.exchange0 = poolRecord.exchange0
	record.exchange1 = poolRecord.exchange1
	record.tvlUSD = poolRecord.tvlUSD

	record.txCount = record.txCount + BigInt(1)

	return record
}

export const updatePool1MnData = async (tokenA: MaybeCurrency, tokenB: MaybeCurrency, timestamp: number,blockNumber: bigint) => {
	const [poolId, token0Name, token1Name] = getPoolId(tokenA, tokenB)
	const hourIndex = Math.ceil(timestamp / 60)
	const recordId = `${poolId}-${hourIndex}`

	await getToken(token0Name)
	await getToken(token1Name)
	await getToken(poolId)

	let record = await Pool1MnData.get(recordId)
	const poolRecord = await getPool(token0Name, token1Name)

	if (!record) {
		record = new Pool1MnData(recordId)

		record.poolId = poolId
		record.date = dayjs.unix(hourIndex * 60).toDate()
		record.token0Id = token0Name
		record.token1Id = token1Name

		record.volumeToken0 = '0'
		record.volumeToken1 = '0'
		record.volumeUSD = '0'
		record.txCount = BigInt(0)
		
		record.rateToken0Token1High = '0'
		record.rateToken0Token1Low = '999999'
		record.rateToken0Token1Open = null
		record.rateToken0Token1Close = null
		record.rateToken1Token0High = '0'
		record.rateToken1Token0Low = '999999'
		record.rateToken1Token0Open = null
		record.rateToken1Token0Close = null
		
		await record.save()
	}

	// update data
	//record.blockNumber.push(blockNumber)

	record.token0Amount = poolRecord.token0Amount
	record.token1Amount = poolRecord.token1Amount
	 
	// Arno
	record.rateToken0Token1 = calculate(poolRecord.token0Amount+"/"+poolRecord.token1Amount)
  	record.rateToken0Token1High = (record.rateToken0Token1 > record.rateToken0Token1High) ? record.rateToken0Token1 : record.rateToken0Token1High
  	record.rateToken0Token1Low = (record.rateToken0Token1 < record.rateToken0Token1Low) ? record.rateToken0Token1 : record.rateToken0Token1Low
  	record.rateToken0Token1Open = (record.rateToken0Token1Open == null) ? record.rateToken0Token1 : record.rateToken0Token1Open
	record.rateToken0Token1Close = record.rateToken0Token1
	record.rateToken1Token0 = calculate(poolRecord.token1Amount+"/"+poolRecord.token0Amount)
  	record.rateToken1Token0High = (record.rateToken1Token0 > record.rateToken1Token0High) ? record.rateToken1Token0 : record.rateToken1Token0High
  	record.rateToken1Token0Low = (record.rateToken1Token0 < record.rateToken1Token0Low) ? record.rateToken1Token0 : record.rateToken1Token0Low
	record.rateToken1Token0Open = (record.rateToken1Token0Open == null) ? record.rateToken1Token0 : record.rateToken1Token0Open
	record.rateToken1Token0Close = record.rateToken1Token0
	
	record.exchange0 = poolRecord.exchange0
	record.exchange1 = poolRecord.exchange1
	record.tvlUSD = poolRecord.tvlUSD

	record.txCount = record.txCount + BigInt(1)

	return record
}

export const updatePoolBlockData = async (tokenA: MaybeCurrency, tokenB: MaybeCurrency, timestamp: number,blockNumber: bigint) => {
	const [poolId, token0Name, token1Name] = getPoolId(tokenA, tokenB)
	const hourIndex = Math.ceil(timestamp)
	const recordId = `${poolId}-${hourIndex}`

	await getToken(token0Name)
	await getToken(token1Name)
	await getToken(poolId)

	let record = await PoolBlockData.get(recordId)
	const poolRecord = await getPool(token0Name, token1Name)

	if (!record) {
		record = new PoolBlockData(recordId)

		record.poolId = poolId
		record.date = dayjs.unix(hourIndex).toDate()
		record.blockNumber = blockNumber;
		record.token0Id = token0Name
		record.token1Id = token1Name

		record.volumeToken0 = '0'
		record.volumeToken1 = '0'
		record.volumeUSD = '0'
		record.txCount = BigInt(0)
		
		record.rateToken0Token1High = '0'
		record.rateToken0Token1Low = '999999'
		record.rateToken0Token1Open = null
		record.rateToken0Token1Close = null
		record.rateToken1Token0High = '0'
		record.rateToken1Token0Low = '999999'
		record.rateToken1Token0Open = null
		record.rateToken1Token0Close = null
		
		await record.save()
	}

	// update hour data
	record.token0Amount = poolRecord.token0Amount
	record.token1Amount = poolRecord.token1Amount
	 
	// Arno
	record.rateToken0Token1 = calculate(poolRecord.token0Amount+"/"+poolRecord.token1Amount)
  	record.rateToken0Token1High = (record.rateToken0Token1 > record.rateToken0Token1High) ? record.rateToken0Token1 : record.rateToken0Token1High
  	record.rateToken0Token1Low = (record.rateToken0Token1 < record.rateToken0Token1Low) ? record.rateToken0Token1 : record.rateToken0Token1Low
  	record.rateToken0Token1Open = (record.rateToken0Token1Open == null) ? record.rateToken0Token1 : record.rateToken0Token1Open
	record.rateToken0Token1Close = record.rateToken0Token1
	record.rateToken1Token0 = calculate(poolRecord.token1Amount+"/"+poolRecord.token0Amount)
  	record.rateToken1Token0High = (record.rateToken1Token0 > record.rateToken1Token0High) ? record.rateToken1Token0 : record.rateToken1Token0High
  	record.rateToken1Token0Low = (record.rateToken1Token0 < record.rateToken1Token0Low) ? record.rateToken1Token0 : record.rateToken1Token0Low
	record.rateToken1Token0Open = (record.rateToken1Token0Open == null) ? record.rateToken1Token0 : record.rateToken1Token0Open
	record.rateToken1Token0Close = record.rateToken1Token0
	
	record.exchange0 = poolRecord.exchange0
	record.exchange1 = poolRecord.exchange1
	record.tvlUSD = poolRecord.tvlUSD

	record.txCount = record.txCount + BigInt(1)

	return record
}


export const updatePoolDayData = async (tokenA: MaybeCurrency, tokenB: MaybeCurrency, timestamp: number, blockNumber: bigint) => {
	const [poolId, token0Name, token1Name] = getPoolId(tokenA, tokenB)
	const dayIndex = Math.ceil(timestamp / 3600 / 24)
	const recordId = `${poolId}-${dayIndex}`

	await getToken(token0Name)
	await getToken(token1Name)
	await getToken(poolId)

	let record = await PoolDayData.get(recordId)
	const poolRecord = await getPool(token0Name, token1Name)

	if (!record) {
		record = new PoolDayData(recordId)

		record.poolId = poolId
		record.date = dayjs.unix(dayIndex * 3600 * 24).toDate()
		record.token0Id = token0Name
		record.token1Id = token1Name

		record.volumeToken0 = '0'
		record.volumeToken1 = '0'
		record.volumeUSD = '0'
		record.token0Open = poolRecord.exchange0
		record.token0Low = poolRecord.exchange0
		record.token0High = poolRecord.exchange0
		record.token0Close = poolRecord.exchange0
		record.txCount = BigInt(0)

		record.rateToken0Token1High = '0'
		record.rateToken0Token1Low = '999999'
		record.rateToken0Token1Open = null
		record.rateToken0Token1Close = null
		record.rateToken1Token0High = '0'
		record.rateToken1Token0Low = '999999'
		record.rateToken1Token0Open = null
		record.rateToken1Token0Close = null

		await record.save()
	}

	// update data
	//record.blockNumber.push(blockNumber)

	record.token0Amount = poolRecord.token0Amount
	record.token1Amount = poolRecord.token1Amount

	record.rateToken0Token1 = calculate(poolRecord.token0Amount+"/"+poolRecord.token1Amount)
	record.rateToken0Token1High = (record.rateToken0Token1 > record.rateToken0Token1High) ? record.rateToken0Token1 : record.rateToken0Token1High
	record.rateToken0Token1Low = (record.rateToken0Token1 < record.rateToken0Token1Low) ? record.rateToken0Token1 : record.rateToken0Token1Low
	record.rateToken0Token1Open = (record.rateToken0Token1Open == null) ? record.rateToken0Token1 : record.rateToken0Token1Open
  	record.rateToken0Token1Close = record.rateToken0Token1
 	record.rateToken1Token0 = calculate(poolRecord.token1Amount+"/"+poolRecord.token0Amount)
	record.rateToken1Token0High = (record.rateToken1Token0 > record.rateToken1Token0High) ? record.rateToken1Token0 : record.rateToken1Token0High
	record.rateToken1Token0Low = (record.rateToken1Token0 < record.rateToken1Token0Low) ? record.rateToken1Token0 : record.rateToken1Token0Low
  	record.rateToken1Token0Open = (record.rateToken1Token0Open == null) ? record.rateToken1Token0 : record.rateToken1Token0Open
  	record.rateToken1Token0Close = record.rateToken1Token0

	record.exchange0 = poolRecord.exchange0
	record.exchange1 = poolRecord.exchange1
	record.tvlUSD = poolRecord.tvlUSD
	record.txCount = record.txCount + BigInt(1)

	return record
}