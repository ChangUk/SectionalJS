export type EntityID = string;
export type EntityRecord = Record<string, any> | null;
export type Callback = (el: HTMLElement, ...args: any[]) => void;

export class Entity {
	private _data: Record<EntityID, EntityRecord>;

	protected _id: EntityID;
	protected _callback: Callback;

	constructor(id: EntityID, data: Record<EntityID, EntityRecord>, callback: Callback) {
		if (!id || !data || !(id in data)) throw new Error(`Invalid parameters: ${id}, ${data}`);
		this._id = id;
		this._data = data;
		this._callback = typeof callback === "function" ? callback : (e) => {};
	}

	protected idfmt(id: EntityID): string {
		return `stnl-${id}`;
	}
	protected clsfmt(clsname: string): string {
		return `stnl-${clsname}`;
	}
	protected cssvarfmt(varname: string): string {
		return `stnl${varname}`;
	}
	protected attrfmt(attrname: string): string {
		return `stnl-${attrname}`;
	}

	protected _getData(): Record<EntityID, EntityRecord> {
		return this._data;
	}

	protected _getEntity(id: EntityID): EntityRecord {
		if (!id) return null;
		if (id in this._data) {
			let entity = this._data[id];

			// TODO: minimum requirements test

			return entity;
		}
		//throw new Error(`Invalid entity ID: ${id}`);
		return null;
	}

	public static TEMPLATE: Record<string, any> = {
		entry: { children: [], title: "", type: "entry" },

		article: { children: [], title: "", type: "article" },

		section: { children: [], title: "", type: "section" },

		paragraph: { content: "", title: "", type: "paragraph" },

		table: { classlist: "", content: { header: "", body: "", footer: "" }, properties: "", title: "", type: "table" },
		tableHeader: { children: [], type: "tableHeader" },
		tableColumn: { content: "", type: "tableColumn" },
		tableBody: { children: [], type: "tableBody" },
		tableRowHeader: { children: [], content: "", type: "tableRowHeader" },
		tableRow: { children: [], type: "tableRow" },
		tableCell: { content: "", type: "tableCell" },

		ledger: { classlist: "", content: { header: "", body: "", footer: "" }, properties: "", title: "", type: "ledger" },
		ledgerHeader: { content: {}, type: "ledgerHeader" },
		ledgerBody: { children: [], type: "ledgerBody" },
		ledgerRecord: { content: {}, type: "ledgerRecord" },
		ledgerFooter: { children: {}, type: "ledgerFooter" },
	};

	public static Template(type: string): EntityRecord {
		if (type in Entity.TEMPLATE) return Entity.TEMPLATE[type];
		else return null;
	}
}
