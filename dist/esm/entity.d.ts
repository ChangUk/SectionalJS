export declare type EntityID = string;
export declare type EntityRecord = Record<string, any> | null;
export declare type Callback = (el: HTMLElement, ...args: any[]) => void;
export declare class Entity {
    private _data;
    protected _id: EntityID;
    protected _callback: Callback;
    constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback);
    protected idfmt(id: EntityID): string;
    protected clsfmt(clsname: string): string;
    protected cssvarfmt(varname: string): string;
    protected attrfmt(attrname: string): string;
    protected _getData(): Record<EntityID, EntityRecord>;
    protected _getEntity(id: EntityID): EntityRecord;
    static TEMPLATE: Record<string, any>;
    static Template(type: string): EntityRecord;
}
