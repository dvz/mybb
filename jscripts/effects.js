//effects.js
String.prototype.parseColor=function(){var a='#';if(this.slice(0,4)=='rgb('){var b=this.slice(4,this.length-1).split(',');var i=0;do{a+=parseInt(b[i]).toColorPart()}while(++i<3)}else{if(this.slice(0,1)=='#'){if(this.length==4)for(var i=1;i<4;i++)a+=(this.charAt(i)+this.charAt(i)).toLowerCase();if(this.length==7)a=this.toLowerCase()}}return(a.length==7?a:(arguments[0]||this))};Element.collectTextNodes=function(b){return $A($(b).childNodes).collect(function(a){return(a.nodeType==3?a.nodeValue:(a.hasChildNodes()?Element.collectTextNodes(a):''))}).flatten().join('')};Element.collectTextNodesIgnoreClass=function(b,c){return $A($(b).childNodes).collect(function(a){return(a.nodeType==3?a.nodeValue:((a.hasChildNodes()&&!Element.hasClassName(a,c))?Element.collectTextNodesIgnoreClass(a,c):''))}).flatten().join('')};Element.setContentZoom=function(a,b){a=$(a);a.setStyle({fontSize:(b/100)+'em'});if(Prototype.Browser.WebKit)window.scrollBy(0,0);return a};Element.getInlineOpacity=function(a){return $(a).style.opacity||''};Element.forceRerendering=function(a){try{a=$(a);var n=document.createTextNode(' ');a.appendChild(n);a.removeChild(n)}catch(e){}};var Effect={_elementDoesNotExistError:{name:'ElementDoesNotExistError',message:'The specified DOM element does not exist, but is required for this effect to operate'},Transitions:{linear:Prototype.K,sinoidal:function(a){return(-Math.cos(a*Math.PI)/2)+0.5},reverse:function(a){return 1-a},flicker:function(a){var a=((-Math.cos(a*Math.PI)/4)+0.75)+Math.random()/4;return a>1?1:a},wobble:function(a){return(-Math.cos(a*Math.PI*(9*a))/2)+0.5},pulse:function(a,b){b=b||5;return(((a%(1/b))*b).round()==0?((a*b*2)-(a*b*2).floor()):1-((a*b*2)-(a*b*2).floor()))},spring:function(a){return 1-(Math.cos(a*4.5*Math.PI)*Math.exp(-a*6))},none:function(a){return 0},full:function(a){return 1}},DefaultOptions:{duration:1.0,fps:100,sync:false,from:0.0,to:1.0,delay:0.0,queue:'parallel'},tagifyText:function(c){var d='position:relative';if(Prototype.Browser.IE)d+=';zoom:1';c=$(c);$A(c.childNodes).each(function(b){if(b.nodeType==3){b.nodeValue.toArray().each(function(a){c.insertBefore(new Element('span',{style:d}).update(a==' '?String.fromCharCode(160):a),b)});Element.remove(b)}})},multiple:function(c,d){var e;if(((typeof c=='object')||Object.isFunction(c))&&(c.length))e=c;else e=$(c).childNodes;var f=Object.extend({speed:0.1,delay:0.0},arguments[2]||{});var g=f.delay;$A(e).each(function(a,b){new d(a,Object.extend(f,{delay:b*f.speed+g}))})},PAIRS:{'slide':['SlideDown','SlideUp'],'blind':['BlindDown','BlindUp'],'appear':['Appear','Fade']},toggle:function(a,b){a=$(a);b=(b||'appear').toLowerCase();var c=Object.extend({queue:{position:'end',scope:(a.id||'global'),limit:1}},arguments[2]||{});Effect[a.visible()?Effect.PAIRS[b][1]:Effect.PAIRS[b][0]](a,c)}};Effect.DefaultOptions.transition=Effect.Transitions.sinoidal;Effect.ScopedQueue=Class.create(Enumerable,{initialize:function(){this.effects=[];this.interval=null},_each:function(a){this.effects._each(a)},add:function(a){var b=new Date().getTime();var c=Object.isString(a.options.queue)?a.options.queue:a.options.queue.position;switch(c){case'front':this.effects.findAll(function(e){return e.state=='idle'}).each(function(e){e.startOn+=a.finishOn;e.finishOn+=a.finishOn});break;case'with-last':b=this.effects.pluck('startOn').max()||b;break;case'end':b=this.effects.pluck('finishOn').max()||b;break}a.startOn+=b;a.finishOn+=b;if(!a.options.queue.limit||(this.effects.length<a.options.queue.limit))this.effects.push(a);if(!this.interval)this.interval=setInterval(this.loop.bind(this),15)},remove:function(a){this.effects=this.effects.reject(function(e){return e==a});if(this.effects.length==0){clearInterval(this.interval);this.interval=null}},loop:function(){var a=new Date().getTime();for(var i=0,len=this.effects.length;i<len;i++)this.effects[i]&&this.effects[i].loop(a)}});Effect.Queues={instances:$H(),get:function(a){if(!Object.isString(a))return a;return this.instances.get(a)||this.instances.set(a,new Effect.ScopedQueue())}};Effect.Queue=Effect.Queues.get('global');Effect.Base=Class.create({position:null,start:function(c){function codeForEvent(a,b){return((a[b+'Internal']?'this.options.'+b+'Internal(this);':'')+(a[b]?'this.options.'+b+'(this);':''))}if(c&&c.transition===false)c.transition=Effect.Transitions.linear;this.options=Object.extend(Object.extend({},Effect.DefaultOptions),c||{});this.currentFrame=0;this.state='idle';this.startOn=this.options.delay*1000;this.finishOn=this.startOn+(this.options.duration*1000);this.fromToDelta=this.options.to-this.options.from;this.totalTime=this.finishOn-this.startOn;this.totalFrames=this.options.fps*this.options.duration;eval('this.render = function(pos){ '+'if (this.state=="idle"){this.state="running";'+codeForEvent(this.options,'beforeSetup')+(this.setup?'this.setup();':'')+codeForEvent(this.options,'afterSetup')+'};if (this.state=="running"){'+'pos=this.options.transition(pos)*'+this.fromToDelta+'+'+this.options.from+';'+'this.position=pos;'+codeForEvent(this.options,'beforeUpdate')+(this.update?'this.update(pos);':'')+codeForEvent(this.options,'afterUpdate')+'}}');this.event('beforeStart');if(!this.options.sync)Effect.Queues.get(Object.isString(this.options.queue)?'global':this.options.queue.scope).add(this)},loop:function(a){if(a>=this.startOn){if(a>=this.finishOn){this.render(1.0);this.cancel();this.event('beforeFinish');if(this.finish)this.finish();this.event('afterFinish');return}var b=(a-this.startOn)/this.totalTime,frame=(b*this.totalFrames).round();if(frame>this.currentFrame){this.render(b);this.currentFrame=frame}}},cancel:function(){if(!this.options.sync)Effect.Queues.get(Object.isString(this.options.queue)?'global':this.options.queue.scope).remove(this);this.state='finished'},event:function(a){if(this.options[a+'Internal'])this.options[a+'Internal'](this);if(this.options[a])this.options[a](this)},inspect:function(){var a=$H();for(property in this)if(!Object.isFunction(this[property]))a.set(property,this[property]);return'#<Effect:'+a.inspect()+',options:'+$H(this.options).inspect()+'>'}});Effect.Parallel=Class.create(Effect.Base,{initialize:function(a){this.effects=a||[];this.start(arguments[1])},update:function(a){this.effects.invoke('render',a)},finish:function(b){this.effects.each(function(a){a.render(1.0);a.cancel();a.event('beforeFinish');if(a.finish)a.finish(b);a.event('afterFinish')})}});Effect.Tween=Class.create(Effect.Base,{initialize:function(b,c,d){b=Object.isString(b)?$(b):b;var e=$A(arguments),method=e.last(),options=e.length==5?e[3]:null;this.method=Object.isFunction(method)?method.bind(b):Object.isFunction(b[method])?b[method].bind(b):function(a){b[method]=a};this.start(Object.extend({from:c,to:d},options||{}))},update:function(a){this.method(a)}});Effect.Event=Class.create(Effect.Base,{initialize:function(){this.start(Object.extend({duration:0},arguments[0]||{}))},update:Prototype.emptyFunction});Effect.Opacity=Class.create(Effect.Base,{initialize:function(a){this.element=$(a);if(!this.element)throw(Effect._elementDoesNotExistError);if(Prototype.Browser.IE&&(!this.element.currentStyle.hasLayout))this.element.setStyle({zoom:1});var b=Object.extend({from:this.element.getOpacity()||0.0,to:1.0},arguments[1]||{});this.start(b)},update:function(a){this.element.setOpacity(a)}});Effect.Move=Class.create(Effect.Base,{initialize:function(a){this.element=$(a);if(!this.element)throw(Effect._elementDoesNotExistError);var b=Object.extend({x:0,y:0,mode:'relative'},arguments[1]||{});this.start(b)},setup:function(){this.element.makePositioned();this.originalLeft=parseFloat(this.element.getStyle('left')||'0');this.originalTop=parseFloat(this.element.getStyle('top')||'0');if(this.options.mode=='absolute'){this.options.x=this.options.x-this.originalLeft;this.options.y=this.options.y-this.originalTop}},update:function(a){this.element.setStyle({left:(this.options.x*a+this.originalLeft).round()+'px',top:(this.options.y*a+this.originalTop).round()+'px'})}});Effect.MoveBy=function(a,b,c){return new Effect.Move(a,Object.extend({x:c,y:b},arguments[3]||{}))};Effect.Scale=Class.create(Effect.Base,{initialize:function(a,b){this.element=$(a);if(!this.element)throw(Effect._elementDoesNotExistError);var c=Object.extend({scaleX:true,scaleY:true,scaleContent:true,scaleFromCenter:false,scaleMode:'box',scaleFrom:100.0,scaleTo:b},arguments[2]||{});this.start(c)},setup:function(){this.restoreAfterFinish=this.options.restoreAfterFinish||false;this.elementPositioning=this.element.getStyle('position');this.originalStyle={};['top','left','width','height','fontSize'].each(function(k){this.originalStyle[k]=this.element.style[k]}.bind(this));this.originalTop=this.element.offsetTop;this.originalLeft=this.element.offsetLeft;var b=this.element.getStyle('font-size')||'100%';['em','px','%','pt'].each(function(a){if(b.indexOf(a)>0){this.fontSize=parseFloat(b);this.fontSizeType=a}}.bind(this));this.factor=(this.options.scaleTo-this.options.scaleFrom)/100;this.dims=null;if(this.options.scaleMode=='box')this.dims=[this.element.offsetHeight,this.element.offsetWidth];if(/^content/.test(this.options.scaleMode))this.dims=[this.element.scrollHeight,this.element.scrollWidth];if(!this.dims)this.dims=[this.options.scaleMode.originalHeight,this.options.scaleMode.originalWidth]},update:function(a){var b=(this.options.scaleFrom/100.0)+(this.factor*a);if(this.options.scaleContent&&this.fontSize)this.element.setStyle({fontSize:this.fontSize*b+this.fontSizeType});this.setDimensions(this.dims[0]*b,this.dims[1]*b)},finish:function(a){if(this.restoreAfterFinish)this.element.setStyle(this.originalStyle)},setDimensions:function(a,b){var d={};if(this.options.scaleX)d.width=b.round()+'px';if(this.options.scaleY)d.height=a.round()+'px';if(this.options.scaleFromCenter){var c=(a-this.dims[0])/2;var e=(b-this.dims[1])/2;if(this.elementPositioning=='absolute'){if(this.options.scaleY)d.top=this.originalTop-c+'px';if(this.options.scaleX)d.left=this.originalLeft-e+'px'}else{if(this.options.scaleY)d.top=-c+'px';if(this.options.scaleX)d.left=-e+'px'}}this.element.setStyle(d)}});Effect.Highlight=Class.create(Effect.Base,{initialize:function(a){this.element=$(a);if(!this.element)throw(Effect._elementDoesNotExistError);var b=Object.extend({startcolor:'#ffff99'},arguments[1]||{});this.start(b)},setup:function(){if(this.element.getStyle('display')=='none'){this.cancel();return}this.oldStyle={};if(!this.options.keepBackgroundImage){this.oldStyle.backgroundImage=this.element.getStyle('background-image');this.element.setStyle({backgroundImage:'none'})}if(!this.options.endcolor)this.options.endcolor=this.element.getStyle('background-color').parseColor('#ffffff');if(!this.options.restorecolor)this.options.restorecolor=this.element.getStyle('background-color');this._base=$R(0,2).map(function(i){return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16)}.bind(this));this._delta=$R(0,2).map(function(i){return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i]}.bind(this))},update:function(a){this.element.setStyle({backgroundColor:$R(0,2).inject('#',function(m,v,i){return m+((this._base[i]+(this._delta[i]*a)).round().toColorPart())}.bind(this))})},finish:function(){this.element.setStyle(Object.extend(this.oldStyle,{backgroundColor:this.options.restorecolor}))}});Effect.ScrollTo=function(a){var b=arguments[1]||{},scrollOffsets=document.viewport.getScrollOffsets(),elementOffsets=$(a).cumulativeOffset(),max=document.viewport.getScrollOffsets[0]-document.viewport.getHeight();if(b.offset)elementOffsets[1]+=b.offset;return new Effect.Tween(null,scrollOffsets.top,elementOffsets[1]>max?max:elementOffsets[1],b,function(p){scrollTo(scrollOffsets.left,p.round())})};Effect.Fade=function(b){b=$(b);var c=b.getInlineOpacity();var d=Object.extend({from:b.getOpacity()||1.0,to:0.0,afterFinishInternal:function(a){if(a.options.to!=0)return;a.element.hide().setStyle({opacity:c})}},arguments[1]||{});return new Effect.Opacity(b,d)};Effect.Appear=function(b){b=$(b);var c=Object.extend({from:(b.getStyle('display')=='none'?0.0:b.getOpacity()||0.0),to:1.0,afterFinishInternal:function(a){a.element.forceRerendering()},beforeSetup:function(a){a.element.setOpacity(a.options.from).show()}},arguments[1]||{});return new Effect.Opacity(b,c)};Effect.Puff=function(b){b=$(b);var c={opacity:b.getInlineOpacity(),position:b.getStyle('position'),top:b.style.top,left:b.style.left,width:b.style.width,height:b.style.height};return new Effect.Parallel([new Effect.Scale(b,200,{sync:true,scaleFromCenter:true,scaleContent:true,restoreAfterFinish:true}),new Effect.Opacity(b,{sync:true,to:0.0})],Object.extend({duration:1.0,beforeSetupInternal:function(a){Position.absolutize(a.effects[0].element)},afterFinishInternal:function(a){a.effects[0].element.hide().setStyle(c)}},arguments[1]||{}))};Effect.BlindUp=function(b){b=$(b);b.makeClipping();return new Effect.Scale(b,0,Object.extend({scaleContent:false,scaleX:false,restoreAfterFinish:true,afterFinishInternal:function(a){a.element.hide().undoClipping()}},arguments[1]||{}))};Effect.BlindDown=function(b){b=$(b);var c=b.getDimensions();return new Effect.Scale(b,100,Object.extend({scaleContent:false,scaleX:false,scaleFrom:0,scaleMode:{originalHeight:c.height,originalWidth:c.width},restoreAfterFinish:true,afterSetup:function(a){a.element.makeClipping().setStyle({height:'0px'}).show()},afterFinishInternal:function(a){a.element.undoClipping()}},arguments[1]||{}))};Effect.SwitchOff=function(c){c=$(c);var d=c.getInlineOpacity();return new Effect.Appear(c,Object.extend({duration:0.4,from:0,transition:Effect.Transitions.flicker,afterFinishInternal:function(b){new Effect.Scale(b.element,1,{duration:0.3,scaleFromCenter:true,scaleX:false,scaleContent:false,restoreAfterFinish:true,beforeSetup:function(a){a.element.makePositioned().makeClipping()},afterFinishInternal:function(a){a.element.hide().undoClipping().undoPositioned().setStyle({opacity:d})}})}},arguments[1]||{}))};Effect.DropOut=function(b){b=$(b);var c={top:b.getStyle('top'),left:b.getStyle('left'),opacity:b.getInlineOpacity()};return new Effect.Parallel([new Effect.Move(b,{x:0,y:100,sync:true}),new Effect.Opacity(b,{sync:true,to:0.0})],Object.extend({duration:0.5,beforeSetup:function(a){a.effects[0].element.makePositioned()},afterFinishInternal:function(a){a.effects[0].element.hide().undoPositioned().setStyle(c)}},arguments[1]||{}))};Effect.Shake=function(g){g=$(g);var h=Object.extend({distance:20,duration:0.5},arguments[1]||{});var i=parseFloat(h.distance);var j=parseFloat(h.duration)/10.0;var k={top:g.getStyle('top'),left:g.getStyle('left')};return new Effect.Move(g,{x:i,y:0,duration:j,afterFinishInternal:function(f){new Effect.Move(f.element,{x:-i*2,y:0,duration:j*2,afterFinishInternal:function(e){new Effect.Move(e.element,{x:i*2,y:0,duration:j*2,afterFinishInternal:function(d){new Effect.Move(d.element,{x:-i*2,y:0,duration:j*2,afterFinishInternal:function(c){new Effect.Move(c.element,{x:i*2,y:0,duration:j*2,afterFinishInternal:function(b){new Effect.Move(b.element,{x:-i,y:0,duration:j,afterFinishInternal:function(a){a.element.undoPositioned().setStyle(k)}})}})}})}})}})}})};Effect.SlideDown=function(b){b=$(b).cleanWhitespace();var c=b.down().getStyle('bottom');var d=b.getDimensions();return new Effect.Scale(b,100,Object.extend({scaleContent:false,scaleX:false,scaleFrom:window.opera?0:1,scaleMode:{originalHeight:d.height,originalWidth:d.width},restoreAfterFinish:true,afterSetup:function(a){a.element.makePositioned();a.element.down().makePositioned();if(window.opera)a.element.setStyle({top:''});a.element.makeClipping().setStyle({height:'0px'}).show()},afterUpdateInternal:function(a){a.element.down().setStyle({bottom:(a.dims[0]-a.element.clientHeight)+'px'})},afterFinishInternal:function(a){a.element.undoClipping().undoPositioned();a.element.down().undoPositioned().setStyle({bottom:c})}},arguments[1]||{}))};Effect.SlideUp=function(b){b=$(b).cleanWhitespace();var c=b.down().getStyle('bottom');var d=b.getDimensions();return new Effect.Scale(b,window.opera?0:1,Object.extend({scaleContent:false,scaleX:false,scaleMode:'box',scaleFrom:100,scaleMode:{originalHeight:d.height,originalWidth:d.width},restoreAfterFinish:true,afterSetup:function(a){a.element.makePositioned();a.element.down().makePositioned();if(window.opera)a.element.setStyle({top:''});a.element.makeClipping().show()},afterUpdateInternal:function(a){a.element.down().setStyle({bottom:(a.dims[0]-a.element.clientHeight)+'px'})},afterFinishInternal:function(a){a.element.hide().undoClipping().undoPositioned();a.element.down().undoPositioned().setStyle({bottom:c})}},arguments[1]||{}))};Effect.Squish=function(b){return new Effect.Scale(b,window.opera?1:0,{restoreAfterFinish:true,beforeSetup:function(a){a.element.makeClipping()},afterFinishInternal:function(a){a.element.hide().undoClipping()}})};Effect.Grow=function(c){c=$(c);var d=Object.extend({direction:'center',moveTransition:Effect.Transitions.sinoidal,scaleTransition:Effect.Transitions.sinoidal,opacityTransition:Effect.Transitions.full},arguments[1]||{});var e={top:c.style.top,left:c.style.left,height:c.style.height,width:c.style.width,opacity:c.getInlineOpacity()};var f=c.getDimensions();var g,initialMoveY;var h,moveY;switch(d.direction){case'top-left':g=initialMoveY=h=moveY=0;break;case'top-right':g=f.width;initialMoveY=moveY=0;h=-f.width;break;case'bottom-left':g=h=0;initialMoveY=f.height;moveY=-f.height;break;case'bottom-right':g=f.width;initialMoveY=f.height;h=-f.width;moveY=-f.height;break;case'center':g=f.width/2;initialMoveY=f.height/2;h=-f.width/2;moveY=-f.height/2;break}return new Effect.Move(c,{x:g,y:initialMoveY,duration:0.01,beforeSetup:function(a){a.element.hide().makeClipping().makePositioned()},afterFinishInternal:function(b){new Effect.Parallel([new Effect.Opacity(b.element,{sync:true,to:1.0,from:0.0,transition:d.opacityTransition}),new Effect.Move(b.element,{x:h,y:moveY,sync:true,transition:d.moveTransition}),new Effect.Scale(b.element,100,{scaleMode:{originalHeight:f.height,originalWidth:f.width},sync:true,scaleFrom:window.opera?1:0,transition:d.scaleTransition,restoreAfterFinish:true})],Object.extend({beforeSetup:function(a){a.effects[0].element.setStyle({height:'0px'}).show()},afterFinishInternal:function(a){a.effects[0].element.undoClipping().undoPositioned().setStyle(e)}},d))}})};Effect.Shrink=function(b){b=$(b);var c=Object.extend({direction:'center',moveTransition:Effect.Transitions.sinoidal,scaleTransition:Effect.Transitions.sinoidal,opacityTransition:Effect.Transitions.none},arguments[1]||{});var d={top:b.style.top,left:b.style.left,height:b.style.height,width:b.style.width,opacity:b.getInlineOpacity()};var e=b.getDimensions();var f,moveY;switch(c.direction){case'top-left':f=moveY=0;break;case'top-right':f=e.width;moveY=0;break;case'bottom-left':f=0;moveY=e.height;break;case'bottom-right':f=e.width;moveY=e.height;break;case'center':f=e.width/2;moveY=e.height/2;break}return new Effect.Parallel([new Effect.Opacity(b,{sync:true,to:0.0,from:1.0,transition:c.opacityTransition}),new Effect.Scale(b,window.opera?1:0,{sync:true,transition:c.scaleTransition,restoreAfterFinish:true}),new Effect.Move(b,{x:f,y:moveY,sync:true,transition:c.moveTransition})],Object.extend({beforeStartInternal:function(a){a.effects[0].element.makePositioned().makeClipping()},afterFinishInternal:function(a){a.effects[0].element.hide().undoClipping().undoPositioned().setStyle(d)}},c))};Effect.Pulsate=function(b){b=$(b);var c=arguments[1]||{};var d=b.getInlineOpacity();var e=c.transition||Effect.Transitions.sinoidal;var f=function(a){return e(1-Effect.Transitions.pulse(a,c.pulses))};f.bind(e);return new Effect.Opacity(b,Object.extend(Object.extend({duration:2.0,from:0,afterFinishInternal:function(a){a.element.setStyle({opacity:d})}},c),{transition:f}))};Effect.Fold=function(c){c=$(c);var d={top:c.style.top,left:c.style.left,width:c.style.width,height:c.style.height};c.makeClipping();return new Effect.Scale(c,5,Object.extend({scaleContent:false,scaleX:false,afterFinishInternal:function(b){new Effect.Scale(c,1,{scaleContent:false,scaleY:false,afterFinishInternal:function(a){a.element.hide().undoClipping().setStyle(d)}})}},arguments[1]||{}))};Effect.Morph=Class.create(Effect.Base,{initialize:function(c){this.element=$(c);if(!this.element)throw(Effect._elementDoesNotExistError);var d=Object.extend({style:{}},arguments[1]||{});if(!Object.isString(d.style))this.style=$H(d.style);else{if(d.style.include(':'))this.style=d.style.parseStyle();else{this.element.addClassName(d.style);this.style=$H(this.element.getStyles());this.element.removeClassName(d.style);var e=this.element.getStyles();this.style=this.style.reject(function(a){return a.value==e[a.key]});d.afterFinishInternal=function(b){b.element.addClassName(b.options.style);b.transforms.each(function(a){b.element.style[a.style]=''})}}}this.start(d)},setup:function(){function parseColor(a){if(!a||['rgba(0, 0, 0, 0)','transparent'].include(a))a='#ffffff';a=a.parseColor();return $R(0,2).map(function(i){return parseInt(a.slice(i*2+1,i*2+3),16)})}this.transforms=this.style.map(function(a){var b=a[0],value=a[1],unit=null;if(value.parseColor('#zzzzzz')!='#zzzzzz'){value=value.parseColor();unit='color'}else if(b=='opacity'){value=parseFloat(value);if(Prototype.Browser.IE&&(!this.element.currentStyle.hasLayout))this.element.setStyle({zoom:1})}else if(Element.CSS_LENGTH.test(value)){var c=value.match(/^([\+\-]?[0-9\.]+)(.*)$/);value=parseFloat(c[1]);unit=(c.length==3)?c[2]:null}var d=this.element.getStyle(b);return{style:b.camelize(),originalValue:unit=='color'?parseColor(d):parseFloat(d||0),targetValue:unit=='color'?parseColor(value):value,unit:unit}}.bind(this)).reject(function(a){return((a.originalValue==a.targetValue)||(a.unit!='color'&&(isNaN(a.originalValue)||isNaN(a.targetValue))))})},update:function(a){var b={},transform,i=this.transforms.length;while(i--)b[(transform=this.transforms[i]).style]=transform.unit=='color'?'#'+(Math.round(transform.originalValue[0]+(transform.targetValue[0]-transform.originalValue[0])*a)).toColorPart()+(Math.round(transform.originalValue[1]+(transform.targetValue[1]-transform.originalValue[1])*a)).toColorPart()+(Math.round(transform.originalValue[2]+(transform.targetValue[2]-transform.originalValue[2])*a)).toColorPart():(transform.originalValue+(transform.targetValue-transform.originalValue)*a).toFixed(3)+(transform.unit===null?'':transform.unit);this.element.setStyle(b,true)}});Effect.Transform=Class.create({initialize:function(a){this.tracks=[];this.options=arguments[1]||{};this.addTracks(a)},addTracks:function(c){c.each(function(a){a=$H(a);var b=a.values().first();this.tracks.push($H({ids:a.keys().first(),effect:Effect.Morph,options:{style:b}}))}.bind(this));return this},play:function(){return new Effect.Parallel(this.tracks.map(function(a){var b=a.get('ids'),effect=a.get('effect'),options=a.get('options');var c=[$(b)||$$(b)].flatten();return c.map(function(e){return new effect(e,Object.extend({sync:true},options))})}).flatten(),this.options)}});Element.CSS_PROPERTIES=$w('backgroundColor backgroundPosition borderBottomColor borderBottomStyle '+'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth '+'borderRightColor borderRightStyle borderRightWidth borderSpacing '+'borderTopColor borderTopStyle borderTopWidth bottom clip color '+'fontSize fontWeight height left letterSpacing lineHeight '+'marginBottom marginLeft marginRight marginTop markerOffset maxHeight '+'maxWidth minHeight minWidth opacity outlineColor outlineOffset '+'outlineWidth paddingBottom paddingLeft paddingRight paddingTop '+'right textIndent top width wordSpacing zIndex');Element.CSS_LENGTH=/^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;String.__parseStyleElement=document.createElement('div');String.prototype.parseStyle=function(){var b,styleRules=$H();if(Prototype.Browser.WebKit)b=new Element('div',{style:this}).style;else{String.__parseStyleElement.innerHTML='<div style="'+this+'"></div>';b=String.__parseStyleElement.childNodes[0].style}Element.CSS_PROPERTIES.each(function(a){if(b[a])styleRules.set(a,b[a])});if(Prototype.Browser.IE&&this.include('opacity'))styleRules.set('opacity',this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);return styleRules};if(document.defaultView&&document.defaultView.getComputedStyle){Element.getStyles=function(c){var d=document.defaultView.getComputedStyle($(c),null);return Element.CSS_PROPERTIES.inject({},function(a,b){a[b]=d[b];return a})}}else{Element.getStyles=function(c){c=$(c);var d=c.currentStyle,styles;styles=Element.CSS_PROPERTIES.inject({},function(a,b){a[b]=d[b];return a});if(!styles.opacity)styles.opacity=c.getOpacity();return styles}}Effect.Methods={morph:function(a,b){a=$(a);new Effect.Morph(a,Object.extend({style:b},arguments[2]||{}));return a},visualEffect:function(a,b,c){a=$(a);var s=b.dasherize().camelize(),klass=s.charAt(0).toUpperCase()+s.substring(1);new Effect[klass](a,c);return a},highlight:function(a,b){a=$(a);new Effect.Highlight(a,b);return a}};$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown '+'pulsate shake puff squish switchOff dropOut').each(function(c){Effect.Methods[c]=function(a,b){a=$(a);Effect[c.charAt(0).toUpperCase()+c.substring(1)](a,b);return a}});$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(function(f){Effect.Methods[f]=Element[f]});Element.addMethods(Effect.Methods);