// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




export class Pool15MnData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public poolId?: string;

    public date?: Date;

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
        assert(id !== null, "Cannot save Pool15MnData entity without an ID");
        await store.set('Pool15MnData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Pool15MnData entity without an ID");
        await store.remove('Pool15MnData', id.toString());
    }

    static async get(id:string): Promise<Pool15MnData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Pool15MnData entity without an ID");
        const record = await store.get('Pool15MnData', id.toString());
        if (record){
            return Pool15MnData.create(record);
        }else{
            return;
        }
    }


    static async getByPoolId(poolId: string): Promise<Pool15MnData[] | undefined>{
      
      const records = await store.getByField('Pool15MnData', 'poolId', poolId);
      return records.map(record => Pool15MnData.create(record));
      
    }

    static async getByToken0Id(token0Id: string): Promise<Pool15MnData[] | undefined>{
      
      const records = await store.getByField('Pool15MnData', 'token0Id', token0Id);
      return records.map(record => Pool15MnData.create(record));
      
    }

    static async getByToken1Id(token1Id: string): Promise<Pool15MnData[] | undefined>{
      
      const records = await store.getByField('Pool15MnData', 'token1Id', token1Id);
      return records.map(record => Pool15MnData.create(record));
      
    }


    static create(record: Partial<Omit<Pool15MnData, FunctionPropertyNames<Pool15MnData>>> & Entity): Pool15MnData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Pool15MnData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
