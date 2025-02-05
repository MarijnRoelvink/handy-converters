class ONInput {
	constructor(text) {
		this.lines = text.split("\n");
		this.re = RegExp(`(\\t*)([\\w\\d]{1,3}[.)])[ \\t](.*)`);
		this.mf = this.parse(this.lines);
	}

	lenEl(arr) {
		return arr.elements.length;
	}

	parse(lines, currIndex = -1) {
		let mf = new MachineFormat(currIndex);
		while (lines.length > 0) {
			let l = lines[0];
			let match = l.match(this.re);
			if (match) {
				let index = match[1].length;
				if (mf.bullet() === "") {
					mf.setBullet(match[2]);
				}
				if (index === currIndex) {
					lines.shift();
					mf.push(match[3]);
				}
				// New sublist encountered
				if (index > currIndex) {
					mf.addSubList(this.parse(lines, index));
				}
				//List has ended
				if (index < currIndex) {
					mf.resetArr();
					return mf;
				}
			} else {
				mf.addNonListItem(lines.shift());
			}
		}
		mf.resetArr();
		return mf;
	}
}

class MachineFormat {
	constructor(index) {
		this.structure = []
		this.arr = {bullet: "", elements: [], index: index};
	}

	getType(bullet) {
		console.log(bullet);
		if(/[\d\w]/.test(bullet)) {
			return "enumerate";
		} else if( bullet.test(/-/)) {
			return "itemize";
		}
	}

	toLines(lines = []) {
		for (const l of this.structure) {
			if (l instanceof MachineFormat) {
				l.toLines(lines);
			} else if (typeof l === "string") {
				lines.push(l.trim());
			} else if ("elements" in l) {
				let tabs = Array(l.index).join("\t");
				let type = this.getType(l.bullet);
				lines.push(tabs + "\\begin{"+ type + "}");
				for (const el of l.elements) {
					lines.push(tabs + "\t\\item " + el.str);
					if (el.children) {
						el.children.toLines(lines);
					}
				}
				lines.push(tabs + "\\end{"+ type + "}");
			}

		}
		return lines
	}

	currLen() {
		return this.arr.elements.length;
	}

	addSubList(mf) {
		if (this.currLen() > 0) {
			this.arr.elements[this.currLen() - 1].children = mf;
		} else {
			this.structure.push(mf);
		}
	}

	push(el) {
		this.arr.elements.push({str: el});
	}

	bullet() {
		return this.arr.bullet;
	}

	setBullet(bullet) {
		this.arr.bullet = bullet;
	}

	resetArr() {
		if (this.currLen() > 0) {
			this.structure.push(this.arr);
			this.arr = {bullet: "", elements: [], index: -1};
		}
	}

	addNonListItem(l) {
		// Non-listitem encountered, reset list
		this.resetArr();
		this.structure.push(l);
	}

	addArr(arr, index, bullet) {
		this.structure.unshift({
			bullet: bullet,
			index: index,
			elements: arr
		})
	}
}