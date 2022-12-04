

ln_cmt "//".*
ml_cmt [/][*][^*]*[*]+([^/*][^*]*[*]+)*[/]

digit [0-9]
integer {digit}+
exponent [eE][+-]?{integer}
real {integer}("."{integer})?{exponent}?

cname [a-zA-Z_]
name {cname}({cname}|{digit})*

qstr ["][^"]*["]
sstr ['][^']*[']

%%

\s+             /* IGNORE: spaces */
{ln_cmt}        /* IGNORE: line comment */
{ml_cmt}        /* IGNORE: multi-line comment */

"("             return '('
")"             return ')'
"["             return '['
"]"             return ']'
"{"             return '{'
"}"             return '}'
","             return ','
";"             return ';'

"'"             return 'TRANSPOSE'
"+"             return '+'
"-"             return '-'
"*"             return '*'
".*"            return '.*'
"/"             return '/'
"./"            return './'
"%"             return '%'
"mod"           return 'MOD'
"^"             return '^'
".^"            return '.^'
"."             return '.'
"!"             return '!'
"&"             return '&'
"~"             return '~'
"|"             return '|'
"^|"            return '^|'
">>>"           return '>>>'
">>"            return '>>'
"<<"            return '<<'
"and"           return 'AND'
"not"           return 'NOT'
"or"            return 'OR'
"xor"           return 'XOR'
"=="            return '=='
"!="            return '!='
"="             return '='
"?"             return '?'
":"             return ':'
"to"            return 'TO'
"in"            return 'IN'
"<="            return '<='
">="            return '>='
"<"             return '<'
">"             return '>'

"let"           return 'LET'
"true"          return 'TRUE'
"false"         return 'FALSE'

"do"            return 'DO'
"if"            return 'IF'
"for"           return 'FOR'
"func"          return 'FUNC'
"else"          return 'ELSE'
"case"          return 'CASE'
"while"         return 'WHILE'
"break"         return 'BREAK'
"switch"        return 'SWITCH'
"return"        return 'RETURN'
"default"       return 'DEFAULT'

{real}          return 'NUMBER'
{name}          return 'NAME'
{qstr}          return 'QSTR'
{sstr}          return 'SSTR'

<<EOF>>         return 'EOF'
.               return 'INVALID'