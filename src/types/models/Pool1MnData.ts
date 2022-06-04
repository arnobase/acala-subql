// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




export class Pool1MnData implements Entity {

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
        assert(id !== null, "Cannot save Pool1MnData entity without an ID");
        await store.set('Pool1MnData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Pool1MnData entity without an ID");
        await store.remove('Pool1MnData', id.toString());
    }

    static async get(id:string): Promise<Pool1MnData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Pool1MnData entity without an ID");
        const record = await store.get('Pool1MnData', id.toString());
        if (record){
            return Pool1MnData.create(record);
        }else{
            return;
        }
    }


    static async getByPoolId(poolId: string): Promise<Pool1MnData[] | undefined>{
      
      const records = await store.getByField('Pool1MnData', 'poolId', poolId);
      return records.map(record => Pool1MnData.create(record));
      
    }

    static async getByToken0Id(token0Id: string): Promise<Pool1MnData[] | undefined>{
      
      const records = await store.getByField('Pool1MnData', 'token0Id', token0Id);
      return records.map(record => Pool1MnData.create(record));
      
    }

    static async getByToken1Id(token1Id: string): Promise<Pool1MnData[] | undefined>{
      
      const records = await store.getByField('Pool1MnData', 'token1Id', token1Id);
      return records.map(record => Pool1MnData.create(record));
      
    }


    static create(record: Partial<Omit<Pool1MnData, FunctionPropertyNames<Pool1MnData>>> & Entity): Pool1MnData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Pool1MnData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
