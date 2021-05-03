import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";
export declare class ContentEntity extends Entity {
    constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback);
    protected _setAction(id: EntityID, el: HTMLElement): null | undefined;
    protected _action(id: EntityID): void;
}
export declare class Paragraph extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement | undefined;
}
export declare class Image extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement | undefined;
}
export declare class Code extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement | undefined;
}
export declare class Ulist extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement | undefined;
}
export declare class Olist extends ContentEntity {
    render(parentEl: HTMLElement): HTMLElement | undefined;
}
export declare class Table extends ContentEntity {
    private _headerDepth;
    private _rowHeaderDepth;
    private _classlist;
    constructor(id: EntityID, data: Record<EntityID, any>, callback: Callback);
    render(parentEl: HTMLElement): HTMLElement | undefined;
    private _header;
    private _column;
    private _body;
    private _rowHeader;
    private _row;
    private _cell;
    private _footer;
}
export declare class Ledger extends ContentEntity {
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
    render(parentEl: HTMLElement): HTMLElement | undefined;
    private _header;
    private _body;
    private _putRecord;
    private _footer;
}
