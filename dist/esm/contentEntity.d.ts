declare type Callback = (el: HTMLElement, ...args: any[]) => void;
declare type EntityID = string;
export declare class ContentEntity {
    protected _id: EntityID;
    protected _data: Record<EntityID, Record<string, any>>;
    protected _callback: Callback;
    constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback);
    idfmt(id: EntityID): string;
    clsfmt(clsname: string): string;
    cssvarfmt(varname: string): string;
    attrfmt(attrname: string): string;
    private _propRequired;
    protected _getEntity(id: EntityID): any;
}
export declare class Paragraph extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement;
}
export declare class Image extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement;
}
export declare class Ulist extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement;
}
export declare class Olist extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement;
}
export declare class Table extends ContentEntity {
    private _classlist;
    constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback);
    render(parentEl: HTMLElement): HTMLTableElement;
    private _header;
    private _column;
    private _body;
    private _rowHeader;
    private _row;
    private _cell;
    private _footer;
}
export declare class Spreadsheet extends ContentEntity {
    private _keys;
    private _types;
    private _records;
    private _values;
    private _mask;
    private _filter;
    private _sort;
    private _classlist;
    constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback);
    sort(option: Array<Record<string, string | null>>): void;
    render(parentEl: HTMLElement): HTMLTableElement;
    private _header;
    private _body;
    private _putRecord;
    private _footer;
}
export {};
