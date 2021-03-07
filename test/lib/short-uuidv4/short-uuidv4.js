String.prototype.padStart = function (length, padString) {
    length = length >> 0; // Truncate if number or convert non-number to 0;
    padString = String((typeof padString !== 'undefined' ? padString : ' '));
    if (this.length > length) {
        return String(this);
    }
    else {
        length -= this.length;
        if (length > padString.length) {
            // Append to original to ensure we are longer than needed
            padString += padString.repeat(length / padString.length);
        }
        return padString.slice(0, length) + String(this);
    }
};
class Converter {
    constructor(srcBase, dstBase) {
        if (!srcBase || !dstBase || !srcBase.length || !dstBase.length) {
            throw new Error("Invalid base string!");
        }
        this.srcBase = srcBase;
        this.dstBase = dstBase;
    }
    run(uuid) {
        if (this.srcBase === this.dstBase)
            return uuid;
        let inputLength = uuid.length;
        let newLength = 0, div = 0;
        let srcLength = this.srcBase.length;
        let dstLength = this.dstBase.length;
        let converted = "";
        let map = {};
        for (let i = 0; i < inputLength; i++)
            map[i] = this.srcBase.indexOf(uuid[i]);
        do {
            div = 0;
            newLength = 0;
            for (let i = 0; i < inputLength; i++) {
                div = div * srcLength + map[i];
                if (div >= dstLength) {
                    map[newLength++] = parseInt((div / dstLength).toString(), 10);
                    div = div % dstLength;
                }
                else {
                    if (newLength > 0)
                        map[newLength++] = 0;
                }
            }
            inputLength = newLength;
            converted = this.dstBase[div] + converted;
        } while (newLength != 0);
        return converted;
    }
}
export class ShortUuidV4 {
    constructor() { }
    checkBase(base) {
        if ([...new Set(Array.from(base))].length !== base.length) {
            throw new Error("The given base string has duplicate characters resulting in unreliable results.");
        }
    }
    uuidv4() {
        return ("10000000-1000-4000-8000-100000000000").replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
    }
    new() {
        return this.generate(ShortUuidV4.BASE_DEF);
    }
    generate(base = ShortUuidV4.BASE_DEF) {
        this.checkBase(base);
        return this.translate(this.uuidv4(), ShortUuidV4.BASE_HEX, base);
    }
    translate(uuid, from = ShortUuidV4.BASE_DEF, to = ShortUuidV4.BASE_HEX) {
        this.checkBase(from);
        this.checkBase(to);
        uuid = uuid.replace(/-/g, '');
        let length = Math.ceil(Math.log(Math.pow(2, 128)) / Math.log(to.length));
        return this.formatUuidV4(new Converter(from, to).run(uuid).padStart(length, to[0]));
    }
    formatUuidV4(uuid) {
        const m = uuid.match(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/);
        return m ? [m[1], m[2], m[3], m[4], m[5]].join('-') : uuid;
    }
}
ShortUuidV4.BASE_DEF = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
ShortUuidV4.BASE_BIN = "01";
ShortUuidV4.BASE_OCT = "01234567";
ShortUuidV4.BASE_DEC = "0123456789";
ShortUuidV4.BASE_HEX = "0123456789abcdef";
//# sourceMappingURL=short-uuidv4.js.map