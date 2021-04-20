import type { EntityID, EntityRecord, Callback } from "./entity.js";
import { Entity } from "./entity.js";
import { LayoutEntity } from "./layoutEntity.js";

export class Sectional {
	private _viewport: HTMLElement;
	private _data: Record<EntityID, EntityRecord>;

	// Options
	private _callback: Callback = (e) => {};
	private _insertSections: Boolean = true;
	private _entry = "0000000000000000000000";

	constructor(view: HTMLElement, json: Record<EntityID, EntityRecord>, options: Record<string, any>) {
		if (!view || !json) throw new Error("Missing parameters!");
		this._viewport = view;
		this._data = json;

		// Set options
		if (options) {
			if ("callback" in options && typeof options.callback === "function") this._callback = options.callback;
			if ("insertSections" in options && typeof options.insertSections === "boolean")
				this._insertSections = options.insertSections;
			if ("entry" in options && typeof options.entry === "string")
				this._entry = options.entry;
		}

		const init = (id: EntityID, parent: EntityID, depth: number): void => {
			if (!id) return;

			// Set metadata
			let entity = this._data[id];
			if (!entity) return;
			entity._id = id;
			entity._depth = depth;
			if (parent) {
				if (!("_parents" in entity)) entity._parents = <Array<EntityID>>[];
				if (!entity._parents.includes(parent)) entity._parents.push(parent);
			}

			// Necessary properties
			if (entity.hasOwnProperty("children")) {
				entity.children.forEach((childId: EntityID) => {
					init(childId, id, depth + 1);
				});
			}
			if (entity.hasOwnProperty("content")) {
				if (entity.content.hasOwnProperty("header"))
					init(entity.content.header, id, depth + 1);
				if (entity.content.hasOwnProperty("body"))
					init(entity.content.body, id, depth + 1);
				if (entity.content.hasOwnProperty("footer"))
					init(entity.content.footer, id, depth + 1);
			}

			// Optional properties
			if (entity.hasOwnProperty("classlist")) {
				init(entity.classlist, id, depth + 1);
			}
			if (entity.hasOwnProperty("properties")) {
				init(entity.properties, id, depth + 1);
			}
			if (entity.hasOwnProperty("action")) {
				init(entity.action, id, depth + 1);
			}
		};
		init(this._entry, "", 0);
	}

	public getEntry(): EntityID {
		return this._entry;
	}

	public getData(): Record<EntityID, EntityRecord> {
		return this._data;
	}

	public setData(data: Record<EntityID, EntityRecord>): void {
		this._data = data;
	}

	public exportData(removeMetadata: boolean = true) {
		let deepCopied = JSON.parse(JSON.stringify(this._data));
		if (removeMetadata) {
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
		try {
			this._data[id] = record;
			return true;
		} catch (e) {
			return false;
		}
	}

	public setMetadata(): void {
		// let reference = (parent: EntityID | null, id: EntityID) => {
		// 	if (!id || id.length !== 22) return;
		// 	if (id in this._data) {
		// 		let entity = this._data[id];
		// 		if (entity) {
		// 			// Metadata
		// 			if (!("_parents" in entity)) entity._parents = new Array<EntityID>();
		// 			if (!entity._parents.contains(parent)) entity._parents.push(parent);
		
		// 			// Necessary properties
		// 			if (entity.children)
		// 				entity.children.forEach((childId: EntityID) => { reference(id, childId); });
		// 			if ("content" in entity && typeof entity.content === "object")
		// 				Object.keys(entity.content).forEach((key: string) => {
		// 					if (entity.content)
		// 					reference(id, entity.content[key]);
		// 				});
		
		// 			// Optional properties
		// 			if (entity.classlist)
		// 				reference(id, entity.classlist);
		// 			if (entity.properties)
		// 				reference(id, entity.properties);
		// 			if (entity.action)
		// 				reference(id, entity.action);
		// 		}
		// 	} else console.log(`--- Broken pointer: parent("${parent}") -> target("${id}")"`);
		// }
		// reference(null, this._entry);
	}

	public removeEntity(id: EntityID) {
		if (id && id in this._data) {
			let entity = <EntityRecord>this._data[id];

			if (entity) {
				if (entity.hasOwnProperty("children")) {
					let children = <Array<EntityID>>entity.children;
					// TODO: 
				}
			}

			delete this._data[id];
			return true;
		} else {
			return false;
		}
	}

	public cleanup(): void {
		// TODO: 
	}

	public getArticles(): Array<EntityID> {
		let rootEntity = this._data[this._entry];
		if (rootEntity) return rootEntity.children;
		return [];
	}

	public article(id: EntityID) {
		this.clearViewport();
		let entity = new LayoutEntity(id, this._data, this._callback);
		entity.article(id, this._viewport, this._insertSections);
	}

	public clearViewport() {
		while (this._viewport.lastChild) this._viewport.removeChild(this._viewport.lastChild);
	}
}
