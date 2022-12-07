//=========================================================
export var SType;
(function (SType) {
    SType[SType["END"] = 0] = "END";
    SType[SType["DEL"] = 1] = "DEL";
    SType[SType["IF"] = 2] = "IF";
    SType[SType["RUN"] = 3] = "RUN";
    SType[SType["DECL"] = 4] = "DECL";
    SType[SType["JUMP"] = 5] = "JUMP";
    SType[SType["COPY"] = 6] = "COPY";
    SType[SType["OPEN"] = 7] = "OPEN";
    SType[SType["CLOSE"] = 8] = "CLOSE";
})(SType || (SType = {}));
export var DType;
(function (DType) {
    DType[DType["RET"] = 0] = "RET";
    DType[DType["LIT"] = 1] = "LIT";
    DType[DType["VAR"] = 2] = "VAR";
    DType[DType["STR"] = 3] = "STR";
    DType[DType["LSTR"] = 4] = "LSTR";
    DType[DType["EXPR"] = 5] = "EXPR";
    DType[DType["TEMP"] = 6] = "TEMP";
    DType[DType["FUNC"] = 7] = "FUNC";
    DType[DType["LABEL"] = 8] = "LABEL";
})(DType || (DType = {}));
//=========================================================
class Builder {
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
    data_tmp() {
        let r = { type: DType.TEMP, elem: this._next_temp };
        this._next_temp += 1;
        return r;
    }
    data_ret() {
        return { type: DType.RET, elem: null };
    }
    data_var(v) {
        return { type: DType.VAR, elem: v };
    }
    data_lit(v) {
        return { type: DType.LIT, elem: v };
    }
    data_str(v) {
        return { type: DType.STR, elem: v };
    }
    data_lstr(v) {
        let elem = [];
        v.forEach((val, idx) => {
            if (val[0] === "str") {
                elem.push([DType.STR, val[1]]);
            }
            else if (val[0] === "expr") {
                elem.push([DType.EXPR, val[1]]);
            }
        });
        return { type: DType.LSTR, elem: elem };
    }
    data_func(v) {
        return { type: DType.FUNC, elem: v };
    }
    data_expr(v) {
        return { type: DType.EXPR, elem: v };
    }
    data_label(v) {
        return { type: DType.LABEL, elem: v };
    }
    //=====================================================
    start_break() {
        this._brea_list.push([]);
        let tmp = this.data_tmp();
        this.gen_stat(SType.OPEN, null, null).target = tmp;
        return tmp;
    }
    add_break(v) {
        if (this._brea_list.length > 0) {
            this._brea_list[this._brea_list.length - 1].push(v);
        }
    }
    end_break(tmp) {
        if (this._brea_list.length > 0) {
            let label = this.data_label(this._next_quad);
            this._brea_list.pop().forEach((b) => {
                b.target = label;
            });
        }
        this.gen_stat(SType.CLOSE, tmp, null);
    }
    //=====================================================
    gen_stat(code, fst, snd) {
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
    gen_return(data) {
        if (data) {
            let s = null;
            if (typeof data === "string") {
                s = this.gen_stat(SType.RUN, this.data_expr(data), null);
            }
            else if (data instanceof Array) {
                if (data[0] === "func") {
                    s = this.gen_stat(SType.RUN, this.gen_func(data[1], data[2]), null);
                }
                else if (data[0] === "lstr") {
                    s = this.gen_stat(SType.RUN, this.data_lstr(data[1]), null);
                }
            }
            if (s) {
                s.target = this.data_ret();
            }
        }
        this._retu_list.push(this.gen_stat(SType.JUMP, null, null));
    }
    gen_break() {
        this.add_break(this.gen_stat(SType.JUMP, null, null));
    }
    gen_expr(expr) {
        this.gen_stat(SType.RUN, this.data_expr(expr), null);
    }
    gen_assign(name, data) {
        if (typeof data === "string") {
            this.gen_stat(SType.RUN, this.data_expr(name + ' = ' + data), null);
        }
        else if (data instanceof Array) {
            if (data[0] === "func") {
                let tmp = this.data_tmp();
                let s = this.gen_stat(SType.RUN, this.gen_func(data[1], data[2]), null);
                s.target = tmp;
                this.gen_stat(SType.COPY, tmp, null).target = this.data_var(name);
                this.gen_stat(SType.DEL, null, null).target = tmp;
            }
            else if (data[0] === "lstr") {
                let tmp = this.data_tmp();
                let s = this.gen_stat(SType.RUN, this.data_lstr(data[1]), null);
                s.target = tmp;
                this.gen_stat(SType.COPY, tmp, null).target = this.data_var(name);
                this.gen_stat(SType.DEL, null, null).target = tmp;
            }
        }
    }
    gen_declare(name, data) {
        if (!data) {
            this.gen_stat(SType.DECL, this.data_str(name), null);
        }
        else if (typeof data === "string") {
            this.gen_stat(SType.DECL, this.data_str(name), this.data_expr(data));
        }
        else if (data instanceof Array) {
            if (data[0] === "func") {
                this.gen_stat(SType.DECL, this.data_str(name), this.gen_func(data[1], data[2]));
            }
            else if (data[0] === "lstr") {
                this.gen_stat(SType.DECL, this.data_str(name), this.data_lstr(data[1]));
            }
        }
    }
    gen_func(args, body) {
        let b = new Builder();
        // generate code
        c3e(b, body);
        // generate end
        let end = b.data_label(b.gen_stat(SType.END, null, null).addr);
        b._retu_list.forEach((s) => { s.target = end; });
        // clean code
        b._quad_list.forEach((s, idx) => {
            b._quad_list[idx] = [s.stat,
                s.arg1 ? [s.arg1.type, s.arg1.elem] : 0,
                s.arg2 ? [s.arg2.type, s.arg2.elem] : 0,
                s.target ? [s.target.type, s.target.elem] : 0];
        });
        return this.data_func([args, b._quad_list]);
    }
    gen_block(block) {
        if (block instanceof Array && block.length > 0) {
            this.gen_stat(SType.OPEN, null, null);
            c3e(this, block);
            this.gen_stat(SType.CLOSE, null, null);
        }
    }
    gen_if(cond, block, else_block) {
        let si = this.gen_stat(SType.IF, this.data_expr(cond), null);
        this.gen_block(block);
        if (else_block) {
            let jmp = this.gen_stat(SType.JUMP, null, null);
            si.target = this.data_label(this._next_quad);
            this.gen_block(else_block);
            jmp.target = this.data_label(this._next_quad);
        }
        else {
            si.target = this.data_label(this._next_quad);
        }
    }
    gen_do(cond, block) {
        let start = this._next_quad;
        let label = this.start_break();
        c3e(this, block);
        let sc = this.gen_stat(SType.IF, this.data_expr('not (' + cond + ')'), null);
        sc.target = this.data_label(start);
        this.end_break(label);
    }
    gen_while(cond, block) {
        let start = this._next_quad;
        let label = this.start_break();
        let sc = this.gen_stat(SType.IF, this.data_expr(cond), null);
        c3e(this, block);
        let jmp = this.gen_stat(SType.JUMP, null, null);
        jmp.target = this.data_label(start);
        sc.target = this.data_label(this._next_quad);
        this.end_break(label);
    }
    gen_for(init, cond, update, block) {
        let sc = null;
        let label = this.start_break();
        if (init) {
            c3e(this, [init]);
        }
        let start = this._next_quad;
        if (cond) {
            sc = this.gen_stat(SType.IF, this.data_expr(cond), null);
        }
        c3e(this, block);
        if (update) {
            c3e(this, update);
        }
        let jmp = this.gen_stat(SType.JUMP, null, null);
        jmp.target = this.data_label(start);
        if (sc) {
            sc.target = this.data_label(this._next_quad);
        }
        this.end_break(label);
    }
    gen_switch(expr, caselist) {
        let labels = [];
        let deft;
        let jmp;
        let label = this.start_break();
        let tmp = this.data_tmp();
        this.gen_stat(SType.RUN, this.data_expr(expr), null).target = tmp;
        caselist.forEach((c) => {
            if (c[0] === "case") {
                labels.push(this.gen_stat(SType.IF, this.data_expr('' + c[1] + ' != $' + tmp.elem + ''), null));
            }
            else if (c[0] === "default") {
                if (!deft) {
                    deft = this.data_label(null);
                }
                let stat = this.gen_stat(SType.JUMP, null, null);
                stat.target = deft;
                labels.push(stat);
            }
        });
        jmp = this.data_label(null);
        this.gen_stat(SType.JUMP, null, null).target = jmp;
        caselist.forEach((c, idx) => {
            if (c[0] === "case") {
                labels[idx].target = this.data_label(this._next_quad);
                c3e(this, c[2]);
            }
            else if (c[0] === "default") {
                deft.elem = this._next_quad;
                c3e(this, c[1]);
            }
        });
        jmp.elem = this._next_quad;
        this.end_break(label);
    }
    //=====================================================
    build(stmts) {
        // reset state
        this._next_temp = 1;
        this._next_quad = 0;
        this._quad_list = [];
        this._brea_list = [];
        this._retu_list = [];
        // generate intermediate code
        c3e(this, stmts);
        // generate end
        let end = this.data_label(this.gen_stat(SType.END, null, null).addr);
        this._retu_list.forEach((s) => { s.target = end; });
        // clean code
        this._quad_list.forEach((s, idx) => {
            this._quad_list[idx] = [s.stat,
                s.arg1 ? [s.arg1.type, s.arg1.elem] : 0,
                s.arg2 ? [s.arg2.type, s.arg2.elem] : 0,
                s.target ? [s.target.type, s.target.elem] : 0];
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
function c3e(bldr, ss) {
    ss.forEach((stmt) => {
        switch (stmt[0]) {
            case 'return':
                bldr.gen_return(stmt[1]);
                break;
            case 'expr':
                bldr.gen_expr(stmt[1]);
                break;
            case 'asgn':
                stmt[1].forEach((s) => {
                    bldr.gen_assign(s[0], s[1]);
                });
                break;
            case 'decl':
                stmt[1].forEach((s) => {
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
export function build(stmts) {
    let builder = new Builder();
    return builder.build(stmts);
}
//=========================================================
