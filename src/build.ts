//=========================================================
export enum SType {
    END,
    DEL,
    IF,
    RUN,
    DECL,
    JUMP,
    COPY,
    OPEN,
    CLOSE
}

export enum DType {
    RET,
    LIT,
    VAR,
    STR,
    EXPR,
    TEMP,
    FUNC,
    LABEL
}

interface Data {
    type: DType;
    elem: any;
}

interface Stat {
    addr: number;
    stat: SType;
    arg1: any;
    arg2: any;
    target: any;
}

//=========================================================
class Builder
{
    private _next_temp: number;
    private _next_quad: number;
    private _quad_list: any[];
    private _brea_list: any[];
    private _retu_list: any[];

    constructor() {
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];
    }

    get code() {
        return this._quad_list;
    }

    data_tmp() : Data { 
        let r = {type: DType.TEMP, elem: this._next_temp};
        this._next_temp += 1; 
        return r;
    } 
    data_ret() : Data {
        return {type: DType.RET, elem: null};
    }
    data_var(v: any) : Data { 
        return {type: DType.VAR, elem: v};
    }
    data_lit(v: any) : Data { 
        return {type: DType.LIT, elem: v}; 
    }
    data_str(v: any) : Data { 
        return {type: DType.STR, elem: v}; 
    }
    data_func(v: any) : Data { 
        return {type: DType.FUNC, elem: v}; 
    }
    data_expr(v: any) : Data { 
        return {type: DType.EXPR, elem: v}; 
    }
    data_label(v: any) : Data { 
        return {type: DType.LABEL, elem: v}; 
    }

    //=====================================================
    start_break() {
        this._brea_list.push([]);
        let tmp = this.data_tmp();
        this.gen_stat(SType.OPEN, null, null).target = tmp;
        return tmp;
    }

    add_break(v: any) {
        if(this._brea_list.length > 0) {
            this._brea_list[this._brea_list.length-1].push(v);
        }
    }

    end_break(tmp: any) {
        if(this._brea_list.length > 0) {
            let label = this.data_label(this._next_quad);
            this._brea_list.pop().forEach((b: Stat) => {
                b.target = label;
            });
        }
        this.gen_stat(SType.CLOSE, tmp, null);
    }

    //=====================================================
    gen_stat(code: SType, fst: any, snd: any) : Stat {
        let aux = {
            addr: this._next_quad, 
            stat: code, 
            arg1: fst, 
            arg2: snd, 
            target: null
        };
        this._next_quad += 1;
        this._quad_list.push(aux);
        return aux;
    }

    gen_return(data: any) {
        if(data) {
            let s = null;
            if(typeof data === "string") {
                s = this.gen_stat(SType.RUN, this.data_expr(data), null);
            }
            else if(data instanceof Array) {
                if(data[0] === "func") {
                    s = this.gen_stat(SType.RUN, this.gen_func(data[1], data[2]), null);
                }
            }
            if(s) {
                s.target = this.data_ret();
            }
        }
        this._retu_list.push(this.gen_stat(SType.JUMP, null, null));
    }

    gen_break() {
        this.add_break(this.gen_stat(SType.JUMP, null, null));
    }

    gen_expr(expr: any) {
        this.gen_stat(SType.RUN, this.data_expr(expr), null);
    }

    gen_assign(name: any, data: any) {
        if(typeof data === "string") {
            this.gen_stat(SType.RUN, this.data_expr(name + ' = ' + data), null);
        }
        else if(data instanceof Array) {
            if(data[0] === "func") {
                let tmp = this.data_tmp();
                let s = this.gen_stat(SType.RUN, this.gen_func(data[1], data[2]), null);
                s.target = tmp;
                this.gen_stat(SType.COPY, tmp, null).target = this.data_var(name);
                this.gen_stat(SType.DEL, null, null).target = tmp;
            }
        }
    }

    gen_declare(name: any, data: any) {
        if(!data) {
            this.gen_stat(SType.DECL, this.data_str(name), null);
        }
        else if(typeof data === "string") {
            this.gen_stat(SType.DECL, this.data_str(name), this.data_expr(data));
        }
        else if(data instanceof Array) {
            if(data[0] === "func") {
                this.gen_stat(SType.DECL, this.data_str(name), this.gen_func(data[1], data[2]));
            }
        }
    }

    gen_func(args: any, body: any) {
        let b = new Builder();

        // generate code
        c3e(b, body)

        // generate end
        let end = b.data_label(b.gen_stat(SType.END, null, null).addr);
        b._retu_list.forEach((s) => {s.target = end;});

        // clean code
        b._quad_list.forEach((s, idx) => {
            b._quad_list[idx] = [s.stat
                , s.arg1 ? [s.arg1.type, s.arg1.elem] : 0
                , s.arg2 ? [s.arg2.type, s.arg2.elem] : 0
                , s.target ? [s.target.type, s.target.elem] : 0];
            });
        
        return this.data_func([args, b._quad_list])
    }

    gen_block(block: any) {
        if(block instanceof Array && block.length > 0) {
            this.gen_stat(SType.OPEN, null, null);
            c3e(this, block);
            this.gen_stat(SType.CLOSE, null, null);
        }
    }

    gen_if(cond: any, block: any, else_block: any) {
        let si = this.gen_stat(SType.IF, this.data_expr(cond), null);
        this.gen_block(block);
        if(else_block) {
            let jmp = this.gen_stat(SType.JUMP, null, null);
            si.target = this.data_label(this._next_quad);
            this.gen_block(else_block);
            jmp.target = this.data_label(this._next_quad);
        }
        else {
            si.target = this.data_label(this._next_quad);
        }
    }

    gen_do(cond: any, block: any) {
        let start = this._next_quad;
        let label = this.start_break();
        c3e(this, block);
        let sc = this.gen_stat(SType.IF, this.data_expr('not (' + cond + ')'), null);
        sc.target = this.data_label(start);
        this.end_break(label);
    }

    gen_while(cond: any, block: any) {
        let start = this._next_quad;
        let label = this.start_break();
        let sc = this.gen_stat(SType.IF, this.data_expr(cond), null);
        c3e(this, block);
        let jmp = this.gen_stat(SType.JUMP, null, null);
        jmp.target = this.data_label(start);
        sc.target = this.data_label(this._next_quad);
        this.end_break(label);
    }

    gen_for(init: any, cond: any, update: any, block: any) {
        let sc = null;
        let label = this.start_break();
        if(init) { 
            c3e(this, [init]); 
        }
        let start = this._next_quad;
        if(cond) { 
            sc = this.gen_stat(SType.IF, this.data_expr(cond), null);
        }
        c3e(this, block);
        if(update) { 
            c3e(this, update); 
        }
        let jmp = this.gen_stat(SType.JUMP, null, null);
        jmp.target = this.data_label(start);
        if(sc) { 
            sc.target = this.data_label(this._next_quad); 
        }
        this.end_break(label);
    }

    gen_switch(expr: any, caselist: any[]) : void {
        let labels: any[] = [];
        let deft: Data;
        let jmp: Data;

        let label = this.start_break();
        let tmp = this.data_tmp();
        this.gen_stat(SType.RUN, this.data_expr(expr), null).target = tmp;
        caselist.forEach((c) => {
            if(c[0] === "case") {
                labels.push(this.gen_stat(SType.IF, this.data_expr(
                    '' + c[1] + ' != $' + tmp.elem + ''), null));
            }
            else if(c[0] === "default") {
                if(!deft) { deft = this.data_label(null); }
                let stat = this.gen_stat(SType.JUMP, null, null);
                stat.target = deft;
                labels.push(stat);
            }
        });
        jmp = this.data_label(null);
        this.gen_stat(SType.JUMP, null, null).target = jmp;
        caselist.forEach((c, idx) => {
            if(c[0] === "case") {
                labels[idx].target = this.data_label(this._next_quad);
                c3e(this, c[2]);
            }
            else if(c[0] === "default") {
                deft.elem = this._next_quad;
                c3e(this, c[1]);
            }
        });
        jmp.elem = this._next_quad;
        this.end_break(label);
    }

    //=====================================================
    build(stmts: any[]) {
        // reset state
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];

        // generate intermediate code
        c3e(this, stmts)

        // generate end
        let end = this.data_label(this.gen_stat(SType.END, null, null).addr);
        this._retu_list.forEach((s) => {s.target = end;});

        // clean code
        this._quad_list.forEach((s, idx) => {
            this._quad_list[idx] = [s.stat
                , s.arg1 ? [s.arg1.type, s.arg1.elem] : 0
                , s.arg2 ? [s.arg2.type, s.arg2.elem] : 0
                , s.target ? [s.target.type, s.target.elem] : 0];
            });
        let prgm = this._quad_list;

        // reset state
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];

        // return code
        return prgm;
    }

}

//=========================================================
function c3e(bldr: Builder, ss: any[]) 
{
    ss.forEach((stmt) => {
        switch(stmt[0]) 
        {
            case 'return':
                bldr.gen_return(stmt[1]);
                break;

            case 'expr':
                bldr.gen_expr(stmt[1]);
                break;

            case 'asgn':
                stmt[1].forEach((s: any[]) => {
                    bldr.gen_assign(s[0], s[1]);
                });
                break;

            case 'decl':
                stmt[1].forEach((s: any[]) => {
                    bldr.gen_declare(s[0], s[1]);
                });
            break;

            case 'if':
                bldr.gen_if(stmt[1], stmt[2], stmt[3]);
            break;

            case 'do':
                bldr.gen_do(stmt[1], stmt[2]);
            break;

            case 'switch':
                bldr.gen_switch(stmt[1], stmt[2]);
            break;

            case 'while':
                bldr.gen_while(stmt[1], stmt[2]);
            break;

            case 'for':
                bldr.gen_for(stmt[1][0], stmt[1][1], stmt[1][2], stmt[2]);
            break;
            
            case 'break':
                bldr.gen_break();
            break;
        }
    });
}

//=========================================================
export function build(stmts: any[]) {
    let builder = new Builder();
    return builder.build(stmts);
}

//=========================================================