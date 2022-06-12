import { SubstrateEvent } from "@subql/types";
import { Dispatcher } from "./utils/dispatcher";
import { Event } from "../types/models";
import { getKVData } from "./utils";
import { DispatchedEventData } from "./types";

import { 
  createDexPool, updatePoolByAddLiquidity, updatePoolByRemoveLiquidity, updatePoolBySwap }
from "./dex/pool";

const dispatch = new Dispatcher<DispatchedEventData>();

dispatch.batchRegist([
  // // dex
  { key: "dex-ProvisioningToEnabled", handler: createDexPool },
  { key: "dex-AddLiquidity", handler: updatePoolByAddLiquidity },
  { key: "dex-RemoveLiquidity", handler: updatePoolByRemoveLiquidity },
  { key: "dex-Swap", handler: updatePoolBySwap },

]);

export async function ensureEvent(event: SubstrateEvent) {
  const idx = event.idx;
  const recordId = `${event.block.block.header.number}-${idx}`;

  let data = await Event.get(recordId);

  if (!data) {
    data = new Event(recordId);
    data.index = idx;
    data.blockNumber = event.block.block.header.number.toBigInt();
    //logger.info(data.blockNumber)
    data.timestamp = event.block.timestamp;

    await data.save();
  }

  return data;
}

export async function createEvent(event: SubstrateEvent) {
  const data = await ensureEvent(event);

  const section = event.event.section;
  const method = event.event.method;
  const eventData = getKVData(event.event.data);

  data.section = section;
  data.method = method;
  data.data = eventData;

  await dispatch.dispatch(`${section}-${data.method}`, {
    event: data,
    rawEvent: event,
  });

  await data.save();

  return data;
}
