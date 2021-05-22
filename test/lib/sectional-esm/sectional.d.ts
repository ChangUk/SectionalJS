import type { EntityID, EntityRecord } from "./entity.js";
export declare class Sectional {
    private _viewport;
    private _data;
    private _callback;
    private _insertSections;
    private _entry;
    constructor(view: HTMLElement, json: Record<EntityID, EntityRecord>, options: Record<string, any>);
    getEntry(): EntityID;
    getData(): Record<EntityID, EntityRecord>;
    setData(data: Record<EntityID, EntityRecord>): void;
    exportData(removeMetadata?: boolean): any;
    getEntity(id: EntityID): EntityRecord;
    setEntity(id: EntityID, record: Record<string, any>): boolean;
    setMetadata(): void;
    removeEntity(id: EntityID): boolean;
    cleanup(): void;
    getArticles(): Array<EntityID>;
    article(id: EntityID): void;
    clearViewport(): void;
}
