
//=========================================================
//=========================================================
class MapScope 
{
	protected _scope : Map<string, any>;

	constructor () 					{ this._scope = new Map<string, any>(); }
	
	get (key: string) 				{ return this._scope.get(key); }
	set (key: string, value: any) 	{ this._scope.set(key, value); }
	has (key: string) 				{ return this._scope.has(key); }
	keys () : Set<string>			{ return new Set(this._scope.keys()); }
}

//=========================================================
//=========================================================
export class Scope extends MapScope 
{
	protected _parent?: Scope;

	constructor (parent: Scope) {
		super();
		this._parent = parent;
	}
  
	get (key: string) : any {
		let r = this._scope.get(key);
		if(!r && this._parent) { 
			r = this._parent.get(key); 
		}
		return r;
	}
  
	has (key: string) : boolean {
		let r = this._scope.has(key);
		if(!r && this._parent) { 
			r = this._parent.has(key);
		}
		return r;
	}

	setLocal(key: string, value: any) {
		return this._scope.set(key, value);
	}

	set (key: string, value: any) {
		let aux : Scope | undefined = this;
		while(aux) {
			if(aux._scope.has(key)) { 
				aux._scope.set(key, value);
			}
			else { 
				aux = aux._parent;
			}
		}
		throw Error("Undeclared variable: " + key);
	}
  
	keys () : Set<string> {
	  if (this._parent) {
		return new Set([...this._scope.keys(), ...this._parent.keys()])
	  } else {
		return new Set(this._scope.keys());
	  }
	}
  
	delete (key: string) {
	  return this._scope.delete(key);
	}
  
	clear () {
	  this._scope.clear();
	}
}

//=========================================================
//=========================================================