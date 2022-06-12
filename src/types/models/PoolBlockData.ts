// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




export class PoolBlockData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public poolId?: string;

    public date?: Date;

    public blockNumber?: bigint;

    public token0Id?: string;

    public token1Id?: string;

    public token0Amount?: string;

    public token1Amount?: string;

    public rateToken0Token1?: string;

    public rateToken0Token1High?: string;

    public rateToken0Token1Low?: string;

    public rateToken0Token1Open?: string;

    public rateToken0Token1Close?: string;

    public rateToken1Token0?: string;

    public rateToken1Token0High?: string;

    public rateToken1Token0Low?: string;

    public rateToken1Token0Open?: string;

    public rateToken1Token0Close?: string;

    public exchange0?: string;

    public exchange1?: string;

    public volumeToken0?: string;

    public volumeToken1?: string;

    public volumeUSD?: string;

    public txCount?: bigint;

    public tvlUSD?: string;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save PoolBlockData entity without an ID");
        await store.set('PoolBlockData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove PoolBlockData entity without an ID");
        await store.remove('PoolBlockData', id.toString());
    }

    static async get(id:string): Promise<PoolBlockData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get PoolBlockData entity without an ID");
        const record = await store.get('PoolBlockData', id.toString());
        if (record){
            return PoolBlockData.create(record);
        }else{
            return;
        }
    }


    static async getByPoolId(poolId: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'poolId', poolId);
      return records.map(record => PoolBlockData.create(record));
      
    }

    static async getByToken0Id(token0Id: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'token0Id', token0Id);
      return records.map(record => PoolBlockData.create(record));
      
    }

    static async getByToken1Id(token1Id: string): Promise<PoolBlockData[] | undefined>{
      
      const records = await store.getByField('PoolBlockData', 'token1Id', token1Id);
      return records.map(record => PoolBlockData.create(record));
      
    }


    static create(record: Partial<Omit<PoolBlockData, FunctionPropertyNames<PoolBlockData>>> & Entity): PoolBlockData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new PoolBlockData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
