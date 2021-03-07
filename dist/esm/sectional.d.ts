declare type Callback = (el: HTMLElement, ...args: any[]) => void;
declare type EntityID = string;
export declare class Sectional {
    private _viewport;
    private _data;
    private _callback;
    constructor(dom: HTMLElement, json: any, callback: Callback);
    static get ENTRY(): EntityID;
    private _init;
    private _createEntityInstance;
    private _children;
    article(id: EntityID): void;
    section(id: EntityID, parentEl: HTMLElement): void;
    clearViewport(): void;
}
export {};
