import * as ContentEntity from "./contentEntity.js"

type Callback = (el: HTMLElement, ...args: any[]) => void;
type EntityID = string;

export class Sectional {
	private _viewport: HTMLElement;
	private _data: Record<EntityID, any>;
	private _callback: Callback;

	constructor(dom: HTMLElement, json: any, callback: Callback) {
		if (!dom || !json) throw new Error("Missing parameters!");
		this._viewport = dom;
		this._data = json;
		this._callback = typeof callback === "function" ? callback : (e) => { };
		this._init(Sectional.ENTRY, "", 0);
	}

	public static get ENTRY(): EntityID {
		return "0000000000000000000000";
	}

	private _init(id: EntityID, parent: EntityID, depth: number): void {
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
				this._init(childId, id, depth + 1);
			});
		}
	}

	private _createEntityInstance(classname: string, id: EntityID) {
		const cls: any = ContentEntity;
		if (typeof cls[classname] !== "undefined")
			return new cls[classname](id, this._data, this._callback);
		else
			throw new Error("Class not found: " + classname);
	}

	private _children(parentEl: HTMLElement, children: Array<string>) {
		if (children) {
			children.forEach((childId: string) => {
				let child = this._data[childId];
				if (child) {
					let childType = child.type.toLowerCase();
					if (childType === "article" || childType === "section") {
						this[childType as keyof Sectional](childId, parentEl);
					} else {
						let className: string = childType.replace(/^.{1}/g, (c: string) => c.toUpperCase());
						let entity = this._createEntityInstance(className, childId);
						entity.render(parentEl);
					}
				}
			});
		}
	}

	public getData() {
		return this._data;
	}

	public article(id: EntityID): void {
		if (!id || !(id in this._data)) throw new Error("Invalid parameter: article(id: string);");
		let entity = this._data[id];
		if (entity && entity.type !== "article") throw new Error(`"Invalid type: ${entity.type}"`);

		this.clearViewport();

		let article = document.createElement("article");
		article.id = `stnl-${id}`;
		this._viewport.appendChild(article);
		entity._dom = article;
		if (entity.label) {
			// TODO: heading level 1
		}
		this._children(entity._dom, entity.children);
	}

	public section(id: EntityID, parentEl: HTMLElement): void {
		if (!id || !parentEl || !(id in this._data))
			throw new Error("Invalid parameters: section(id: string, parentId: string)");
		let entity = this._data[id];
		if (entity && entity.type !== "section") throw new Error(`"Invalid type: ${entity.type}"`);

		let section = document.createElement("section");
		parentEl.appendChild(section);
		entity._dom = section;
		if (entity.label) {
			let heading = document.createElement("h" + entity._depth);
			heading.id = `stnl-${id}`;
			heading.innerHTML = entity.label;
			section.appendChild(heading);
			section.setAttribute("area-label", entity.label);
			this._callback.call(this, heading);
		}
		this._children(entity._dom, entity.children);
	}

	public clearViewport() {
		while (this._viewport.lastChild) this._viewport.removeChild(this._viewport.lastChild);
	}
}
