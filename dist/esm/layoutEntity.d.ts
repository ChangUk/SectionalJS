import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";
export declare class LayoutEntity extends Entity {
    constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback);
    private _children;
    private _createContentEntity;
    article(id: EntityID, parentEl: HTMLElement, insertSections?: Boolean): void;
    section(id: EntityID, parentEl: HTMLElement, insertSections?: Boolean): void;
}
