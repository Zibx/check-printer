/**
 * Created by zibx on 6/4/16.
 */
'use strict';
var Z = require('z-lib');

var repeat = function (count, char) {
    return count<=0?'':new Array(count+1).join(char).substr(0, count);
};
var dimensions = {top: 0, right: 1, bottom: 2, left: 3};
var getWidths = function (cfg) {

    var width = 'width' in cfg ? cfg.width : 1, widths = [0,0,0,0], i;
    if(typeof width === 'number')
        widths = [width];
    else
        widths = width.slice();

    for(i = 0; i < 4; i++)
        widths[i] = i in widths? widths[i] : widths[i>1?i%2:0];

    for(i in dimensions)
        if(cfg[i] && ('width' in cfg[i]))
            widths[dimensions[i]] = cfg[i].width;

    return widths;
};
var getSymbols = function (cfg, defaultSymbol) {
    var symbol = cfg.symbol || defaultSymbol, symbols, i;
    if(typeof symbol === 'string')
        symbols = [symbol];
    else
        symbols = symbol.slice();

    for(i = 0; i < 4; i++)
        symbols[i] = i in symbols? symbols[i] : symbols[i>1?i%2:0];

    for(i in dimensions)
        if(cfg[i] && ('symbol' in cfg[i]))
            symbols[dimensions[i]] = cfg[i].symbol;

    return symbols;
};
var lineAlign = {
    justify: function(line, len, background){
        var subLine = '';
        background = background || ' ';
        while (line.length > 1) {
            var diff = len - line.join('').length - subLine.length,
                spaces = diff / (line.length - 1);
            subLine += line.shift() + (new Array(Math.ceil(spaces) + 1)).join(background);
        }
        return (subLine + line[0]);
    },
    left: function (line, len, background) {
        background = background || ' ';
        var val = line.join(background);

        return val+repeat(len - val.length ,background);
    },
    right: function (line, len, background) {
        background = background || ' ';
        var val = line.join(background);
        return repeat(len - val.length ,background)+val;
    },
    center: function (line, len, background) {
        background = background || ' ';
        var val = line.join(background);
        return repeat(Math.floor((len - val.length)/2) ,background)+ val +repeat(Math.ceil((len - val.length)/2),background);
    }
};
var replace = function (str, pos, substr, len) {
    return str.substr(0,pos)+substr+str.substr(pos+len);
};
var valueGetter = Z.getProperty('value');
var alignBlocks = function (items, len, background) {
    background = background || ' ';
    var content = items.map(function(item){
        return item.toString().split('\n');
    }),
        max = 0, i, line, out = [], j, _j = items.length, style, item, subLine, vertical;
    for( i = _j; i;){
        --i;
        if(max<content[i].length)
            max = content[i].length;
    }
    for( i = 0; i < max; i++){
        line = repeat(len, background);
        for(j = 0; j < _j; j++){
            item = items[j];
            style = item.style;
            vertical = i;

            if('top' in style)
                vertical -= style.top;

            if('bottom' in style)
                vertical = i-(max-style.bottom-content[j].length);

            subLine = content[j][vertical];
            if(subLine === void 0)
                subLine = '';

            if('left' in style)
                line = replace(line, style.left, subLine, subLine.length);

            if('right' in style)
                line = replace(line, len - style.right - subLine.length, subLine, subLine.length);
        }
        out.push(line);

    }


    return out;;
};
var align = function(str, len, align) {
    var out = [],
        lineAligner = lineAlign[align],
        lastLineAligner = lineAlign[align==='right'||align==='center'?align:'left'],
        collector = [],
        doBreak,
        line = [], min = 0, item, newLine,
        collectorCount, i = 0;

    str.replace(/([^\s\n]+)|([\s\n])/g, function(a,b){
        collector.push({type:b?1:0, value: a, length: b?a.length: 0});
    });
    collector.push({value: '\n', length: 0, type:1});

    collectorCount = collector.length;

    while(collectorCount > i){
        item = collector[i];

        min += item.length;
        newLine = item.value === '\n';
        doBreak = min > len;

        if(item.type === 1 && !doBreak && !newLine)
            line.push(item);

        if(min<=len || newLine)
            i++;

        if(min >= len || newLine){
            out.push(
                (line.length === 1 || newLine? lastLineAligner : lineAligner) // select right justify function
                    (line.map(valueGetter), len) // and call it
            );
            line = [];
            min = 0;
        }else if(item.type===0){ // add spaces
            min++;
        }
    }

    return out;
};

var wrap = function (content, cfg, defaultSymbol) {
    var symbols = getSymbols(cfg, defaultSymbol), width, widths = getWidths(cfg),
        borderLeft, borderRight, i,
        out = [], tmp;// = content[0].length;

    //console.log(widths,symbols);
    width = content[0].length;
    tmp = repeat(width+widths[3]+widths[1], symbols[0]);
    for(i = widths[0]; i--;)
        out.push(tmp);

    borderLeft = (function(width, symbol){
        var cache;
        if(typeof(symbol) === 'function'){
            return function(a,b,c){
                a = symbol(a,b,c);
                return repeat(width, a);
            };
        }else{
            cache = repeat(width, symbol);
            return function () {
                return cache;
            };
        }
    })(widths[3], symbols[3]);
    borderRight = function(){
        return repeat(widths[1], symbols[1]);
    };

    out = out.concat(content.map(function(el, i){
        return borderLeft(i,el)+ el +borderRight(i, el);
    }));

    tmp = repeat(width+widths[3]+widths[1], symbols[2]);
    for(i = widths[2]; i--;)
        out.push(tmp);
    content = out;
    return content;
};
var Block = function(cfg){
    Z.apply(this, cfg);
    if(!this.style)
        this.style = {};
    if( !this.width )
        this.width = (this.style && this.style.width) || (this.parent && (this.parent.innerWidth || this.parent.width));
    this.innerWidth = this.width;


    this._calculateBox();
    this._calculateContent();
};
Block.prototype = {
    content: '',
    _calculateBox: function () {
        var box = this.box = {};
        var style = this.style,
            offset = ['padding','border','margin'].reduce(function(store, name){
                var widths = box[name] = style[name] ? getWidths(style[name]) : [0,0,0,0];
                return widths.map(function (el, i) {
                    return el + store[i];
                });
            }, [0,0,0,0]);
        this.innerWidth = this.width - (offset[1]+offset[3]);
        this.innerHeight = this.height - (offset[0]+offset[2]);
    },
    _calculateContent: function () {
        if(this.value)
            this.content = align(this.value, this.innerWidth, this.style.align || 'left');

        if(this.items)
            this.content = alignBlocks(this.items, this.innerWidth, this.style.background);
    },
    postProcess: function () {
        var style = this.style;
        return ['padding','border','margin'].reduce(function(content, name){
            return style[name] ? wrap(content, style[name], name === 'border' ? '*' : ' ') : content;
        }, this.content).join('\n');
    },
    toString: function () {
        return this.postProcess();
    }
};
/*
var b = new Block({
    value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis dolor mauris, at elementum ligula tempor eget. In quis rhoncus nunc, at aliquet orci. Fusce at dolor sit amet felis suscipit tristique. Nam a imperdiet tellus. Nulla eu vestibulum urna. Vivamus tincidunt suscipit enim, nec ultrices nisi volutpat ac. Maecenas sit amet lacinia arcu, non dictum justo. Donec sed quam vel risus faucibus euismod. Suspendisse rhoncus rhoncus felis at fermentum. Donec lorem magna, ultricies a nunc sit amet, blandit fringilla nunc. In vestibulum velit ac felis rhoncus pellentesque. Mauris at tellus enim. Aliquam eleifend tempus dapibus. Pellentesque commodo, nisi sit amet hendrerit fringilla, ante odio porta lacus, ut elementum justo nulla et dolor.',
    style: {
        width: 45,
        align: 'justify',
        border: {
            width: [2,3, 1,4],
            symbol: '|',
            left: {
                symbol: function(i){
                    return (i%2?'\\':'/') + (i<1 ?'  ':(i<10?'0':'')+i) +'|';
                }//['\\ |','/ |']
            },
            top: {
                width: 1,
                symbol: '____|'
            }},
        padding: {
            width:[1,2]
        },
        margin: {width:[1,3]}
    }
});*/
var text = 'Lorem ipsum\n dolor sit amet, consectetur adipiscing elit. Vestibulum sagittis dolor mauris, at elementum ligula tempor eget. In quis rhoncus nunc, at aliquet orci. Fusce at dolor sit amet felis suscipit tristique. Nam a imperdiet tellus. Nulla eu vestibulum urna. Vivamus tincidunt suscipit enim, nec ultrices nisi volutpat ac. Maecenas sit amet lacinia arcu, non dictum justo. Donec sed quam vel risus faucibus euismod. Suspendisse rhoncus rhoncus felis at fermentum. Donec lorem magna, ultricies a nunc sit amet, blandit fringilla nunc. In vestibulum velit ac felis rhoncus pellentesque. Mauris at tellus enim. Aliquam eleifend tempus dapibus. Pellentesque commodo, nisi sit amet hendrerit fringilla, ante odio porta lacus, ut elementum justo nulla et dolor.';

var b = [new Block({
    value: text,
    style: {align: 'right', width:31, border:{width: 0, left: {width:1}}, left: 0}
}),
    new Block({
        value: text.substr(0,300),
        style: {align: 'justify', width:30, left: 35, top:1}
    }),
    new Block({
        value: text.substr(0,300),
        style: {align: 'left', width:31, border:{width: 0, right: {width:1}}, right: 0, bottom: 3}
    })];
var x = new Block({
    items: b,
    style: {width: 99, background: '%'}
});
/*var b = new Block({
    value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    style: {width: 19, align: 'right', height: 7, border: {width:1}}
});*/

console.log(x+'');
/*
console.log(
    (b+'').split('\n').join(' ').replace(/(\s+)/g,' '))
console.log(
    text.split('\n').join(' ').replace(/(\s+)/g,' '));
console.log(
    (b+'').split('\n').join(' ').replace(/(\s+)/g,' ') ===
    text.split('\n').join(' ').replace(/(\s+)/g,' '))*/

