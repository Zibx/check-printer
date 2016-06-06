/**
 * Created by zibx on 6/4/16.
 */
var Z = require('z-lib');
/*var content = {width: 40, items: [
    {style: { border: {width: 1, symbol: '*'}, padding: [0, 1]}, items: [
        {value: 'ООО "Мясновъ - 77"', style: {float: 'left'}},
        {value: 'ИНН 7737530891', style: {float: 'right'}},
        {value: 'Мясновъ', style: {align: 'center', height: 3, valign: 'center'}},
        /!*{value: 'МЯСНОВЪ - магазин ЗДОРОВОго питания', style: {align: 'center'}},*!/
    ]}
]};*/
/*

 */

var content = {
    
    
}

var styles = {
    border: function (cfg) {
        this.innerWidth -= cfg.width * 2;
    },
    padding: function(cfg){
        this.innerWidth -= cfg instanceof Array ? cfg[1] * 2: cfg;
    },
    float: function(cfg){
        this.parent.addFloat(this, cfg)
    }
};
var Item = function(cfg){
    Z.apply(this, cfg);
    this.lines = [];
    var _self = this;
    this.calculateStyle();
    if(this.items)
        this.items = this.items.map(function (item) {
            item.parent = _self;
            return preprocess(item);
        });
    //this.float && this.parent.addFloat(this);

};
var repeat = function (count, char) {
    return new Array(count+1).join(char);
};
var Line = function(cfg){
    Z.apply(this, cfg);
    this.value = repeat(this.width, ' ');
    this.free = [0,this.width];
};
Line.prototype = {
    left: function(item){
        var val = item.value;
        this.replace(this.free[0], val.length, val);
        this.free[0]+=val.length;
    },
    right: function(item){
        var val = item.value;
        this.replace(this.free[1]-val.length, val.length, val);
        this.free[1]-=val.length;
    },
    replace: function (from, length, val) {
        this.value = this.value.substr(0,from) + val + this.value.substr(from+length);
    },
    canFit: function (item) {
        return this.free[1]-this.free[0] >= item.value.length;
    }
};
Item.prototype = {
    addFloat: function (item, float) {
        if(!(this.lastLine && this.lastLine.canFit(item)))
            this.addLine();

        if(float === 'left'){
            this.lastLine.left(item);
        }else if(float === 'right'){
            this.lastLine.right(item);
        }
    },
    addLine: function () {
        this.lines.push(this.lastLine = new Line({width: this.innerWidth || this.width}))
    },
    calculateStyle: function(){
        if(!('width' in this))
            this.width = this.innerWidth = this.parent.innerWidth || this.parent.width;
        var style, i, rule;
        if(style = this.style){
            for(i in style){
                rule = style[i];
                styles[i].call(this, style[i]);
            }
        }

    }
};
var preprocess = function(cfg){
    return new Item(cfg);
};

console.log(preprocess(content));