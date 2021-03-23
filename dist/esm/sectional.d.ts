import type { EntityID, EntityRecord } from "./entity.js";
export declare class Sectional {
    private _viewport;
    private _data;
    private _callback;
    private _layout;
    constructor(view: HTMLElement, json: Record<EntityID, EntityRecord>, options: Record<string, any>);
    static get ENTRY(): EntityID;
    importData(data: Record<EntityID, EntityRecord>): void;
    exportData(removeMeta?: boolean): any;
    getEntity(id: EntityID): EntityRecord;
    setEntity(id: EntityID, record: Record<string, any>): boolean;
    getArticles(): Array<EntityID>;
    article(id: EntityID): void;
    clearViewport(): void;
}
