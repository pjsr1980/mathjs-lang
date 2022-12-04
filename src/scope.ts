
export class MapScope 
{
	constructor () {
	  	this.localScope = new Map()
	}
  
	get (key) {
	  	return this.localScope.get(key)
	}
  
	set (key, value) {
	  	return this.localScope.set(key, value)
	}
  
	has (key) {
	  	return this.localScope.has(key)
	}
  
	keys () {
	  	return this.localScope.keys()
	}
}
  
export class AdvancedMapScope extends MapScope 
{
	constructor (parent) {
		super()
		this.parentScope = parent
	}
  
	get (key) {
		let r = this.localScope.get(key);
		if(!r && this.parentScope) { r = this.parentScope.get(key); }
		return r;
	}
  
	has (key) {
		let r = this.localScope.has(key);
		if(!r && this.parentScope) { r = this.parentScope.has(key); }
		return r;
	}

	setLocal(key, value) {
		return this.localScope.set(key, value);
	}

	set (key, value) {
		let aux = this;
		while(aux) {
			if(aux.localScope.has(key)) { 
				return aux.localScope.set(key, value);
			}
			else { aux = aux.parentScope; }
		}
		// if(!aux) { aux = this; }
		throw Error("Undeclared variable: " + key);
	}
  
	keys () {
	  if (this.parentScope) {
		return new Set([...this.localScope.keys(), ...this.parentScope.keys()])
	  } else {
		return this.localScope.keys()
	  }
	}
  
	delete (key) {
	  return this.localScope.delete(key);
	}
  
	clear () {
	  this.localScope.clear();
	}
}