(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[2],{"/sTe":function(e,t,a){"use strict";a.r(t);a("BoS7");var l=a("Sdc0"),n=(a("iQDF"),a("+eQT")),r=(a("giR+"),a("fyUT")),i=(a("7Kak"),a("9yH6")),c=(a("+L6B"),a("2/Rp")),o=(a("tU7J"),a("wFql")),m=(a("jCWc"),a("kPKH")),u=(a("14J3"),a("BMrR")),s=(a("5NDa"),a("5rEg")),E=(a("y8nQ"),a("Vl3Y")),d=a("qIgq"),p=a.n(d),g=a("q1tI"),h=a.n(g),y=a("71ry"),b=a("JKkQ"),f=a("c+yx"),v=a("ih5i"),I=a("/MKj"),C=a("NFtC"),O=a.n(C),P=e=>{var t=e.dispatch,a=e.loading,d=E["a"].useForm(),g=p()(d,1),I=g[0],C=e=>{var a=e;console.log({val:a});var l={title:a.title,polls:[{question:a.question,options:[a.first,a.second,...a.options||[]].filter(f["b"]).map((e,t)=>({name:e,code:t+1}))}],authorization:a.authorization,visibility:a.visibility,votesCap:a.votesCap,encrypted:a.encrypted,challenges:a.challenges,startDate:a.period[0],endDate:a.period[1]};console.log({createVoting:l}),Object(v["dispatchCreateVoting"])(t,l)};return h.a.createElement(E["a"],{layout:"vertical",form:I,name:"options_form",onFinish:C,initialValues:{votesCap:100,authorization:b["a"].OPEN,visibility:b["b"].PUBLIC,encrypted:!1,challenges:100}},h.a.createElement(E["a"].Item,{name:"title",label:"Title",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},h.a.createElement(s["a"],{placeholder:"Favourite colour"})),h.a.createElement(E["a"].Item,{name:"question",label:"Question",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},h.a.createElement(s["a"],{placeholder:"What is your favourite colour ?"})),h.a.createElement(E["a"].Item,{label:"Options"},h.a.createElement(u["a"],null,h.a.createElement(m["a"],{flex:"10px",style:{marginRight:10}},h.a.createElement(o["a"],null,"1")),h.a.createElement(m["a"],{flex:"auto"},h.a.createElement(E["a"].Item,{name:"first",key:"first",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0},h.a.createElement(s["a"],{placeholder:"Blue",style:{marginRight:32}}))),h.a.createElement(m["a"],{flex:"30px",style:{marginRight:10}}))),h.a.createElement(E["a"].Item,null,h.a.createElement(u["a"],null,h.a.createElement(m["a"],{flex:"10px",style:{marginRight:10}},h.a.createElement(o["a"],null,"2")),h.a.createElement(m["a"],{flex:"auto"},h.a.createElement(E["a"].Item,{name:"second",key:"second",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0},h.a.createElement(s["a"],{placeholder:"Red",style:{marginRight:32}}))),h.a.createElement(m["a"],{flex:"30px",style:{marginRight:10}}))),h.a.createElement(E["a"].List,{name:"options"},(e,t)=>{var a=t.add,l=t.remove;return h.a.createElement("div",null,e.map((e,t)=>h.a.createElement(E["a"].Item,{label:"",required:!1,key:e.key},h.a.createElement(u["a"],null,h.a.createElement(m["a"],{flex:"10px",style:{marginRight:10}},h.a.createElement(o["a"],null,t+3)),h.a.createElement(m["a"],{flex:"auto"},h.a.createElement(E["a"].Item,Object.assign({},e,{validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0}),h.a.createElement(s["a"],{placeholder:"Option",style:{marginRight:32}}))),h.a.createElement(m["a"],{flex:"30px",style:{marginRight:10}},h.a.createElement(y["MinusCircleOutlined"],{className:O.a.dynamicDeleteButton,onClick:()=>{l(e.name)}}))))),h.a.createElement(E["a"].Item,null,h.a.createElement(c["a"],{type:"dashed",onClick:()=>{a()}},h.a.createElement(y["PlusOutlined"],null)," Add an option")))}),h.a.createElement(E["a"].Item,{name:"authorization",label:"Authorization method"},h.a.createElement(i["a"].Group,null,h.a.createElement(i["a"].Button,{value:b["a"].OPEN},Object(f["a"])(b["a"].OPEN)),h.a.createElement(i["a"].Button,{value:b["a"].EMAIL},Object(f["a"])(b["a"].EMAIL)),h.a.createElement(i["a"].Button,{value:b["a"].CODE},Object(f["a"])(b["a"].CODE)))),h.a.createElement(E["a"].Item,{name:"visibility",label:"Listing visibility"},h.a.createElement(i["a"].Group,null,h.a.createElement(i["a"].Button,{value:b["b"].PUBLIC},Object(f["a"])(b["b"].PUBLIC)),h.a.createElement(i["a"].Button,{value:b["b"].UNLISTED},Object(f["a"])(b["b"].UNLISTED)),h.a.createElement(i["a"].Button,{value:b["b"].PRIVATE},Object(f["a"])(b["b"].PRIVATE)))),h.a.createElement(E["a"].Item,{label:"Number of votes cap"},h.a.createElement(E["a"].Item,{name:"votesCap",noStyle:!0},h.a.createElement(r["a"],{min:2}))),h.a.createElement(E["a"].Item,{name:"period",label:"Select time period",rules:[{type:"array",required:!0,message:"Please select time!"}]},h.a.createElement(n["a"].RangePicker,null)),h.a.createElement(E["a"].Item,{name:"encrypted",label:"Encrypt results until the end of voting",valuePropName:"checked"},h.a.createElement(l["a"],null)),h.a.createElement(E["a"].Item,{label:"Security level (number of challenges)"},h.a.createElement(E["a"].Item,{name:"challenges",noStyle:!0},h.a.createElement(r["a"],{min:2,max:100}))),h.a.createElement(E["a"].Item,null,h.a.createElement(c["a"],{type:"primary",htmlType:"submit",loading:a},a?"Creating...":"Create")))};t["default"]=Object(I["c"])(e=>{var t=e.loading;return{loading:t.effects["".concat(v["CREATE"],"/").concat(v["CREATE_VOTING"])]}})(P)},JKkQ:function(e,t,a){"use strict";var l,n;a.d(t,"b",function(){return l}),a.d(t,"a",function(){return n}),function(e){e["PUBLIC"]="public",e["UNLISTED"]="unlisted",e["PRIVATE"]="private"}(l||(l={})),function(e){e["OPEN"]="open",e["EMAIL"]="email",e["CODE"]="code",e["CUSTOM"]="custom"}(n||(n={}))},NFtC:function(e,t,a){e.exports={"dynamic-delete-button":"dynamic-delete-button___NsKQg"}},"c+yx":function(e,t,a){"use strict";(function(e){function l(e){return e&&0!==e.length&&e.trim()}function n(e){return e.charAt(0).toUpperCase()+e.substring(1)}a.d(t,"b",function(){return l}),a.d(t,"a",function(){return n})}).call(this,a("HDXh").Buffer)}}]);