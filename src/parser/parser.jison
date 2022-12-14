
/* javascript language declarations */
%{
    function lstrDump(lstr) {
        let res = [];
        let pos = 0, idx;
        lstr = lstr.substring(1, lstr.length-1);
        if(lstr[0] === "\n") { lstr = lstr.substring(1); }
        lstr = lstr.replaceAll("\\`", "`").replaceAll("\\\\", "\\");
        while((idx = lstr.indexOf("${", pos)) >= 0) {
            if(idx > pos) {
                res.push(["str", lstr.substring(pos, idx)]);
            }
            pos = idx + 2;
            idx = lstr.indexOf("}", pos);
            if(idx < 0) {
                throw new Error(lstr);
            }
            let expr = lstr.substring(pos, idx).trim();
            if(expr.length > 0) {
                res.push(["expr", expr]);
            }
            pos = idx + 1;
        }
        if(pos < lstr.length) {
            res.push(["str", lstr.substring(pos, lstr.length)]);
        }
        return res;
    }
%}

/* jison declarations */

/* operator associations and precedence */
%left SEMICOLON
%left ','
%right '='
%right '?' ':'
%left 'or'
%left 'xor'
%left 'and'
%left '|'
%left '^|'
%left '&'
%left '==' '!=' '<' '>' '<=' '>=' 
%left '<<' '>>' '>>>'
%left 'to' 'in'
%right RANGE
%left '+' '-'
%left '*' '/' '.*' './' '%' 'mod'
%right UMINUS UPLUS '~' 'not'
%right '^' '.^'
%right UNIT
%left '!'
%left TRANSPOSE 
%left '.'

%start prgm

/* grammar rules */

%% 
//---------------------------------------------------------
prgm
    : eof                   {return [];}
    | prgm SEMICOLON        {$$ = $1;}
    | prgm stmt             {$$ = $1.concat([$2]);}
    | SEMICOLON             {$$ = [];}
    | stmt                  {$$ = [$1];}
    | prgm eof              {return $1;}
    ;

//---------------------------------------------------------
stmt
    : stmt                  {$$ = $1;}
    | stmt_if               {$$ = $1;}
    | stmt_do               {$$ = $1;}
    | stmt_for              {$$ = $1;}
    | stmt_break            {$$ = $1;}
    | stmt_while            {$$ = $1;}
    | stmt_switch           {$$ = $1;}
    | stmt_return           {$$ = $1;}
    | stmt_decl             {$$ = $1;}
    | stmt_asgn             {$$ = $1;}
    | stmt_expr             {$$ = $1;}
    ;

//---------------------------------------------------------
stmt_body
    : '{' '}'               {$$ = [];}
    | '{' stmt_array '}'    {$$ = $2;}
    ;

stmt_array
    : stmt_array stmt       {$$ = $1.concat([$2]);}
    | stmt_array SEMICOLON  {$$ = $1;}
    | stmt                  {$$ = [$1];}
    | SEMICOLON             {$$ = [];}
    ;

stmt_list
    : stmt_list ',' stmt    {$$ = $1.concat([$3]);}
    | stmt                  {$$ = [$1];}
    ;

//---------------------------------------------------------
stmt_if 
    : IF '(' e ')' stmt_body stmt_else
        {$$ = ['if', $3, $5, $6];}
    | IF '(' e ')' stmt_body
        {$$ = ['if', $3, $5, null];}
    ;

stmt_else
    : ELSE stmt_if          {$$ = [$2];}
    | ELSE stmt_body        {$$ = $2;}
    ;

//---------------------------------------------------------
stmt_do
    : DO stmt_body WHILE '(' e ')'
        {$$ = ['do', $5, $2]}
    ;

stmt_while
    : WHILE '(' e ')' stmt_body
        {$$ = ['while', $3, $5]}
    ;

stmt_break
    : BREAK SEMICOLON       {$$ = ['break']}
    ;

stmt_return
    : RETURN SEMICOLON      {$$ = ['return', null]}
    | RETURN lstr SEMICOLON {$$ = ['return', $2]}
    | RETURN func SEMICOLON {$$ = ['return', $2]}
    | RETURN e SEMICOLON    {$$ = ['return', $2]}
    ;

//---------------------------------------------------------
stmt_switch
    : SWITCH '(' e ')' stmt_switch_body             {$$ = ['switch', $3, $5]}
    ;

stmt_switch_body
    : '{' stmt_switch_case_list '}'                 {$$ = $2;}
    ;

stmt_switch_case_list
    : stmt_switch_case_list stmt_switch_case        {$$ = $1.concat([$2]);}
    | stmt_switch_case_list stmt_switch_default     {$$ = $1.concat([$2]);}
    | stmt_switch_case                              {$$ = [$1];}
    | stmt_switch_default                           {$$ = [$1];}
    ;

stmt_switch_case
    : CASE e ':' stmt_array                         {$$=['case', $2, $4];}
    | CASE e ':'                                    {$$=['case', $2, []];}
    ;

stmt_switch_default
    : DEFAULT ':' stmt_array                        {$$=['default', $3];}
    | DEFAULT ':'                                   {$$=['default', []];}
    ;

//---------------------------------------------------------
stmt_for
    : FOR stmt_for_args stmt_body
        {$$ = ['for', $2, $3]}
    ;

stmt_for_args
    : '(' SEMICOLON SEMICOLON ')'                   {$$ = [null, null, null];}
    | '(' stmt_for_init SEMICOLON SEMICOLON ')'     {$$ = [$2, null, null]}
    | '(' SEMICOLON e SEMICOLON ')'                 {$$ = [null, $3, null]}
    | '(' SEMICOLON SEMICOLON stmt_list ')'         {$$ = [null, null, $4]}
    | '(' SEMICOLON e SEMICOLON stmt_list ')'       {$$ = [null, $3, $5]}
    | '(' stmt_for_init SEMICOLON e SEMICOLON ')'   {$$ = [$2, $4, null]}
    | '(' stmt_for_init SEMICOLON SEMICOLON stmt_list ')' {$$ = [$2, null, $5]}
    | '(' stmt_for_init SEMICOLON e SEMICOLON stmt_list ')' {$$ = [$2, $4, $6]}
    ;

stmt_for_init
    : stmt_decl             { $$ = $1; }
    | stmt_asgn             { $$ = $1; }
    ;

//---------------------------------------------------------
stmt_asgn
    : stmt_asgn_list        { $$ = ['asgn', $1]; }
    ;

stmt_asgn_list
    : stmt_asgn_list ',' stmt_asgn_item
        {$$ = $1.concat([$3]);}
    | stmt_asgn_item
        {$$ = [$1];}
    ;

stmt_asgn_item
    : e '=' lstr            { $$ = [$1, $3]; } 
    | e '=' func            { $$ = [$1, $3]; }
    | e '=' e               { $$ = [$1, $3]; }
    ;

//---------------------------------------------------------
stmt_decl
    : LET stmt_decl_list    { $$ = ['decl', $2]; }
    ;

stmt_decl_list
    : stmt_decl_list ',' stmt_decl_item
        { $$ = $1.concat([$3]); }
    | stmt_decl_item 
        { $$ = [$1]; }
    ;

stmt_decl_item
    : name '=' lstr         { $$ = [$1, $3]; }
    | name '=' func         { $$ = [$1, $3]; }
    | name '=' e            { $$ = [$1, $3]; }
    | name                  { $$ = [$1]; }
    ;

//---------------------------------------------------------
func 
    : FUNC func_args stmt_body
        {$$=['func', $2, $3]}
    ;

func_args
    : '(' ')'               {$$ = []}
    | '(' func_args_list ')'{$$ = $2;}
    ;

func_args_list
    : func_args_list ',' name
        {$$ = $1.concat([$3]);}
    | name
        {$$ = [$1];}
    ;

//---------------------------------------------------------
stmt_expr
    : e                     { $$ = ['expr', $1]; }
    ;

//---------------------------------------------------------
// https://mathjs.org/docs/expressions/syntax.html
e
    : e OR e                {$$ = $1 + ' or ' + $3}
    | e XOR e               {$$ = $1 + ' xor ' + $3}
    | e AND e               {$$ = $1 + ' and ' + $3}
    | e '|' e               {$$ = $1 + ' | ' + $3}
    | e '^|' e              {$$ = $1 + ' ^| ' + $3}
    | e '&' e               {$$ = $1 + ' & ' + $3}
    | e '==' e              {$$ = $1 + ' == ' + $3}
    | e '!=' e              {$$ = $1 + ' != ' + $3}
    | e '>' e               {$$ = $1 + ' > ' + $3}
    | e '<' e               {$$ = $1 + ' < ' + $3}
    | e '>=' e              {$$ = $1 + ' >= ' + $3}
    | e '<=' e              {$$ = $1 + ' <= ' + $3}
    | e '>>>' e             {$$ = $1 + ' >>> ' + $3}
    | e '>>' e              {$$ = $1 + ' >> ' + $3}
    | e '<<' e              {$$ = $1 + ' << ' + $3}
    | e TO string           {$$ = $1 + ' to ' + $3}
    | e IN string           {$$ = "unit(" + $1 + ',' + $3 + ")";}
    | e ':' e %prec RANGE   {$$ = $1 + ' : ' + $3}
    | e '+' e               {$$ = $1 + ' + ' + $3;}
    | e '-' e               {$$ = $1 + ' - ' + $3;}
    | e '*' e               {$$ = $1 + ' * ' + $3;}
    | e '/' e               {$$ = $1 + ' / ' + $3;}
    | e '.*' e              {$$ = $1 + ' .* ' + $3;}
    | e './' e              {$$ = $1 + ' ./ ' + $3;}
    | e '%' e               {$$ = $1 + ' % ' + $3;}
    | e MOD e               {$$ = $1 + ' mod ' + $3;}
    | '-' e %prec UMINUS    {$$ = '-' + $2;}
    | '+' e %prec UPLUS     {$$ = '+' + $2;}
    | '~' e                 {$$ = '~ ' + $2;}
    | NOT e                 {$$ = 'not ' + $2;}
    | e '^' e               {$$ = $1 + ' ^ ' + $3;}
    | e '.^' e              {$$ = $1 + ' .^ ' + $3;}
    | e '!'                 {$$ = $1 + '!';}
    | e TRANSPOSE           {$$ = $1 + "'"; }
    | e '%'                 {$$ = $1 + '%';}
    | e '.' e               {$$ = $1 + '.' + $3;}
    | e '[' exprList ']'    {$$ = $1 + '[' + $3 + ']';}
    | e funcCall            {$$ = $1 + $2;}
    | object                {$$ = $1;}
    | matrix                {$$ = $1;}
    | '(' e ')'             {$$ = '(' + $2 + ')';}

    | HEX                   {$$ = yytext;}
    | OCT                   {$$ = yytext;}
    | BIN                   {$$ = yytext;}
    | NUMBER                {$$ = yytext;}
    | TRUE                  {$$ = 'true';}
    | FALSE                 {$$ = 'false';}
    | string                {$$ = $1;}
    | name                  {$$ = $1;}
    ;

name
    : NAME                  {$$ = yytext;}
    ;

string 
    : QSTR                  {$$ = yytext;}
    | SSTR                  {$$ = yytext;}
    ;

lstr
    : LSTR                  {$$ = ['lstr', lstrDump(yytext)];}
    ;

funcCall
    : '(' ')'               {$$ = '()'}
    | '(' exprList ')'      {$$ = '(' + $2 + ')'}
    ;

exprList 
    : exprList ',' e        {$$ = $1 + ', ' + $3;}
    | e                     {$$ = $1;}
    ;

object
    : '{' '}'               {$$ = '{}';}
    | '{' objectItemList '}'{$$ = '{' + $2 + '}';}
    ;

objectItemList
    : objectItemList ',' objectItem
        {$$ = $1 + ', ' + $3;}
    | objectItem
        {$$ = $1;}
    ;

objectItem
    : objectKey ':' e       {$$ = $1 + ': ' + $3;}
    ;

objectKey
    : NAME                  {$$ = yytext;}
    | string                {$$ = $1;}
    ;

matrix
    : '[' ']'               {$$ = '[]';}
    | '[' matrixRows ']'    {$$ = '[' + $2 + ']';}
    ;

matrixRows
    : matrixRows SEMICOLON exprList
        {$$ = $1 + '; ' + $3}
    | exprList
        {$$ = $1}
    ;

eof
    : EOF
    ;