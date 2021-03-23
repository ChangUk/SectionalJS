import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";
import { LayoutEntity } from "./layoutEntity.js";

export class Sectional {
	private _viewport: HTMLElement;
	private _data: Record<EntityID, EntityRecord>;

	private _callback: Callback = (e) => {};
	private _layout: Boolean = true;

	constructor(view: HTMLElement, json: Record<EntityID, EntityRecord>, options: Record<string, any>) {
		if (!view || !json) throw new Error("Missing parameters!");
		this._viewport = view;
		this._data = json;

		// Set options
		if (options) {
			if ("callback" in options && typeof options.callback === "function") this._callback = options.callback;
			if ("insertLayouts" in options && typeof options.insertLayouts === "boolean")
				this._layout = options.insertLayouts;
		}

		const init = (id: EntityID, parent: EntityID, depth: number): void => {
			if (!id) return;

			// Metadata
			let entity = this._data[id];
			if (!entity) throw new Error(`Invalid entity: ${id}`);
			entity._id = id;
			entity._depth = depth;
			if (parent) {
				if (!("_parent" in entity)) entity._parent = <Array<EntityID>>[];
				entity._parent.push(parent);
			}

			// Iterate through child entities
			if (entity.children) {
				entity.children.forEach((childId: EntityID) => {
					init(childId, id, depth + 1);
				});
			}
		};
		init(Sectional.ENTRY, "", 0);
	}

	public static get ENTRY(): EntityID {
		return "0000000000000000000000";
	}

	public importData(data: Record<EntityID, EntityRecord>): void {
		this._data = data;
	}

	public exportData(removeMeta: boolean = true) {
		let deepCopied = JSON.parse(JSON.stringify(this._data));
		if (removeMeta) {
			Object.keys(deepCopied).forEach((id: EntityID) => {
				let entity = deepCopied[id];
				for (const key of Object.keys(entity)) {
					if (key.startsWith('_')) delete entity[key];
				}
			});
		}
		return deepCopied;
	}

	public getEntity(id: EntityID): EntityRecord {
		if (!(id in this._data)) return null;
		return this._data[id];
	}

	public setEntity(id: EntityID, record: Record<string, any>): boolean {
		if (id in this._data) {
			return false;
		} else {
			this._data[id] = record;
			return true;
		}
	}

	public getArticles(): Array<EntityID> {
		let entry = this._data[Sectional.ENTRY];
		if (entry) return entry.children;
		return [];
	}

	public article(id: EntityID) {
		this.clearViewport();
		let entity = new LayoutEntity(id, this._data, this._callback);
		entity.article(id, this._viewport, this._layout);
	}

	public clearViewport() {
		while (this._viewport.lastChild) this._viewport.removeChild(this._viewport.lastChild);
	}
}
