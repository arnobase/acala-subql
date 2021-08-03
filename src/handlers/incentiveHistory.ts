import {  EventHandler } from "./types";
import { IncentiveAction } from "../types/models";
import { ensureAccount } from "./account";
import { mapUpdateKVData } from "./utils/updateKVData";
import { Balance, Share } from "@acala-network/types/interfaces";
import { PoolInfo } from "@open-web3/orml-types/interfaces";

export const createDepositDexShareHistory: EventHandler =  async ({ event, rawEvent }) => {
  const record = new IncentiveAction(event.id);

  record.type = 'DepositDexShare';
  record.extrinsicId = event.extrinsicId;
  record.timestamp = rawEvent.block.timestamp;

  if (rawEvent.values) {
    const [account] = rawEvent.event.data;

    const accountRecord = await ensureAccount(account.toString());

    record.accountId = accountRecord.id;
  }

  if (event.data) {
    const keyArray = [
      { key: 'account' },
      { key: 'DexShare' },
      { key: 'Amount'}
    ];
    record.data = mapUpdateKVData(event.data, keyArray);
  }

  await record.save();
}

export const createWithdrawDexShareHistory: EventHandler = async ({ event, rawEvent }) => {
  const record = new IncentiveAction(event.id);

  record.type = 'WithdrawDexShare';
  record.extrinsicId = event.extrinsicId;
  record.timestamp = rawEvent.block.timestamp;

  if (rawEvent.values) {
    const [account] = rawEvent.event.data;

    const accountRecord = await ensureAccount(account.toString());

    record.accountId = accountRecord.id;
  }

  if (event.data) {
    const keyArray = [
      { key: 'account' },
      { key: 'DexShare' },
      { key: 'Amount'},
    ];
    record.data = mapUpdateKVData(event.data, keyArray);
  }

  await record.save();
}

export const createClaimRewards: EventHandler = async ({ event, rawEvent }) => {
  const record = new IncentiveAction(event.id);

  record.type = 'claimRewards';
  record.extrinsicId = event.extrinsicId;
  record.timestamp = rawEvent.block.timestamp;

  if (rawEvent.values) {
    const [account] = rawEvent.event.data;

    const accountRecord = await ensureAccount(account.toString());

    record.accountId = accountRecord.id;
  }

  if (event.data) {
    const keyArray = [
      { key: 'account' },
      { key: 'PoolId' }
    ];
    record.data = mapUpdateKVData(event.data, keyArray);
  }

  await record.save();
}