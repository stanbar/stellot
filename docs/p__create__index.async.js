(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[2],{"/sTe":function(e,t,a){"use strict";a.r(t);a("BoS7");var n=a("Sdc0"),o=(a("iQDF"),a("+eQT")),r=(a("giR+"),a("fyUT")),l=(a("7Kak"),a("9yH6")),i=(a("+L6B"),a("2/Rp")),c=(a("jCWc"),a("kPKH")),u=(a("14J3"),a("BMrR")),s=(a("5NDa"),a("5rEg")),d=(a("y8nQ"),a("Vl3Y")),m=a("qIgq"),p=a.n(m),f=a("q1tI"),h=a.n(f),g=a("71ry"),b=a("hBab"),E=a("c+yx"),y=a("ih5i"),v=a("/MKj"),x=a("NFtC"),O=a.n(x),C=a("CQ3q"),I=e=>{var t=e.dispatch,a=e.loading,m=d["a"].useForm(),v=p()(m,1),x=v[0],I=Object(f["useState"])(!1),z=p()(I,2),A=z[0],j=z[1],B=e=>{var a=e;console.log({val:a});var n={title:a.title,polls:[{question:a.question,options:[a.first,a.second,...a.options||[]].filter(E["c"]).map((e,t)=>({name:e,code:t+1}))}],authorization:a.authorization,authorizationOptions:a.authorizationOptions,visibility:a.visibility,votesCap:a.votesCap,encrypted:a.encrypted,challenges:a.challenges,startDate:a.period[0],endDate:a.period[1]};console.log({createVoting:n}),Object(y["dispatchCreateVoting"])(t,n)},S={labelCol:{xs:{span:24},sm:{span:8}},wrapperCol:{xs:{span:24},sm:{span:16}}},w={wrapperCol:{xs:{span:24,offset:0},sm:{span:16,offset:8}}};return h.a.createElement(d["a"],Object.assign({layout:"horizontal"},S,{form:x,name:"options_form",onFinish:B,scrollToFirstError:!0,initialValues:{votesCap:100,authorization:b["Authorization"].OPEN,visibility:b["Visibility"].PUBLIC,encrypted:!1,challenges:100}}),h.a.createElement(d["a"].Item,{name:"title",label:"Title",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},h.a.createElement(s["a"],{placeholder:"Favourite colour"})),h.a.createElement(d["a"].Item,{name:"question",label:"Question",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},h.a.createElement(s["a"],{placeholder:"What is your favourite colour ?"})),h.a.createElement(d["a"].Item,{label:"Options"},h.a.createElement(u["a"],null,h.a.createElement(c["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},"1."),h.a.createElement(c["a"],{flex:"auto"},h.a.createElement(d["a"].Item,Object.assign({},S,{name:"first",key:"first",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0}),h.a.createElement(s["a"],{placeholder:"Blue",style:{marginRight:32}}))))),h.a.createElement(d["a"].Item,Object.assign({},w),h.a.createElement(u["a"],null,h.a.createElement(c["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},"2."),h.a.createElement(c["a"],{flex:"auto"},h.a.createElement(d["a"].Item,{name:"second",key:"second",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0},h.a.createElement(s["a"],{placeholder:"Red",style:{marginRight:32}}))))),h.a.createElement(d["a"].List,{name:"options"},(e,t)=>{var a=t.add,n=t.remove;return h.a.createElement("div",null,e.map((e,t)=>h.a.createElement(d["a"].Item,Object.assign({},w,{label:"",required:!1,key:e.key}),h.a.createElement(u["a"],null,h.a.createElement(c["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},t+3),h.a.createElement(c["a"],{flex:"auto"},h.a.createElement(d["a"].Item,Object.assign({},e,{validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0}),h.a.createElement(s["a"],{placeholder:"Option",style:{marginRight:32}}))),h.a.createElement(c["a"],{flex:"30px",style:{alignSelf:"center",textAlign:"center"}},h.a.createElement(g["MinusCircleOutlined"],{className:O.a.dynamicDeleteButton,onClick:()=>{n(e.name)}}))))),h.a.createElement(d["a"].Item,Object.assign({},w),h.a.createElement(i["a"],{type:"dashed",onClick:()=>{a()}},h.a.createElement(g["PlusOutlined"],null)," Add an option")))}),h.a.createElement(d["a"].Item,{name:"authorization",label:"Authorization method"},h.a.createElement(l["a"].Group,null,h.a.createElement(l["a"].Button,{value:b["Authorization"].OPEN},Object(E["a"])(b["Authorization"].OPEN)),h.a.createElement(l["a"].Button,{disabled:!0,value:b["Authorization"].EMAIL},Object(E["a"])(b["Authorization"].EMAIL)),h.a.createElement(l["a"].Button,{disabled:!0,value:b["Authorization"].CODE},Object(E["a"])(b["Authorization"].CODE)),h.a.createElement(l["a"].Button,{value:b["Authorization"].KEYBASE},Object(E["a"])(b["Authorization"].KEYBASE)))),h.a.createElement(d["a"].Item,{noStyle:!0,shouldUpdate:(e,t)=>e.authorization!==t.authorization},e=>{var t=e.getFieldValue;return console.log(t("authorization")),t("authorization")===b["Authorization"].KEYBASE?h.a.createElement(d["a"].Item,{name:["authorizationOptions","team"],label:"(Optional) Team membership",rules:[{whitespace:!0,message:"Please input option value or delete this field."}]},h.a.createElement(s["a"],{placeholder:"stellar.public"})):null}),h.a.createElement(d["a"].Item,{name:"visibility",label:"Listing visibility"},h.a.createElement(l["a"].Group,null,h.a.createElement(l["a"].Button,{value:b["Visibility"].PUBLIC},Object(E["a"])(b["Visibility"].PUBLIC)),h.a.createElement(l["a"].Button,{value:b["Visibility"].UNLISTED},Object(E["a"])(b["Visibility"].UNLISTED)),h.a.createElement(l["a"].Button,{value:b["Visibility"].PRIVATE},Object(E["a"])(b["Visibility"].PRIVATE)))),h.a.createElement(d["a"].Item,{label:"Number of votes cap"},h.a.createElement(d["a"].Item,{name:"votesCap",noStyle:!0},h.a.createElement(r["a"],{min:2}))),h.a.createElement(d["a"].Item,{name:"period",label:"Select time period",rules:[{type:"array",required:!0,message:"Please select time!"}]},h.a.createElement(o["a"].RangePicker,null)),!A&&h.a.createElement(d["a"].Item,Object.assign({},w),h.a.createElement("a",{style:{fontSize:12},onClick:()=>{j(!0)}},h.a.createElement(g["DownOutlined"],null)," Show advanced")),A&&h.a.createElement(h.a.Fragment,null,h.a.createElement(d["a"].Item,{name:"encrypted",label:"Encrypt results until the end of voting",valuePropName:"checked"},h.a.createElement(n["a"],null)),h.a.createElement(d["a"].Item,{label:"Security level (number of challenges)"},h.a.createElement(d["a"].Item,{name:"challenges",noStyle:!0},h.a.createElement(r["a"],{min:2,max:100})))),h.a.createElement(d["a"].Item,Object.assign({},w),h.a.createElement(C["d"],{size:"large",type:"primary",htmlType:"submit",loading:a},a?"Creating...":"Create")))};t["default"]=Object(v["c"])(e=>{var t=e.loading;return{loading:t.effects["".concat(y["CREATE"],"/").concat(y["CREATE_VOTING"])]}})(I)},CQ3q:function(e,t,a){"use strict";a.d(t,"a",function(){return f}),a.d(t,"c",function(){return h}),a.d(t,"d",function(){return g}),a.d(t,"b",function(){return b});a("+L6B");var n=a("2/Rp"),o=a("fFZ8"),r=a.n(o),l=a("vOnD"),i=a("xhQn");function c(){var e=r()(["\n  background-color: #00000000;\n  color: ",";\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n"]);return c=function(){return e},e}function u(){var e=r()(["\n  background-color: ",";\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n"]);return u=function(){return e},e}function s(){var e=r()(["\n  background-color: ",";\n  color: ",";\n  border-color: ",";\n  float: right;\n  border: 1px solid;\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n  &:hover {\n    color: ",";\n    background-color: #00000000;\n    border-color: ",";\n  }\n"]);return s=function(){return e},e}function d(){var e=r()(["\n  background-color: ",";\n  color: ",";\n  border-color: ",";\n  float: right;\n  width: 120px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    background: ",";\n    opacity: 0.6;\n    pointer-events: none;\n    cursor: default;\n  }\n  &:hover {\n    color: ",";\n    background-color: ",";\n  }\n"]);return d=function(){return e},e}function m(){var e=r()(["\n  background-color: ",";\n  border-radius: 5px;\n  border: 0;\n  color: ",";\n  cursor: pointer;\n  font-family: 'Clear Sans Bold','Nitti Grotesk','Museo Sans','Helvetica Neue',Verdana,Arial,sans-serif;\n  font-size: 18px;\n  font-weight: 500;\n  line-height: initial;\n  padding: 14px 0 18px 0;\n  &:hover {\n    opacity: 0.8;\n  }\n  &:focus {\n    outline: 0;\n  }\n"]);return m=function(){return e},e}var p=Object(l["a"])(n["a"])(m(),i["a"],i["c"]),f=Object(l["a"])(p)(d(),e=>e.color?e.color:i["a"],i["c"],e=>e.color?e.color:i["a"],i["b"],i["c"],e=>e.color?e.color:i["a"]),h=Object(l["a"])(p)(s(),i["c"],e=>e.color?e.color:i["a"],e=>e.color?e.color:i["a"],e=>e.color?e.color:i["a"],e=>e.color?e.color:i["a"]),g=Object(l["a"])(p)(u(),e=>e.color?e.color:i["a"]),b=Object(l["a"])(p)(c(),e=>e.color?e.color:i["a"])},NFtC:function(e,t,a){e.exports={"dynamic-delete-button":"dynamic-delete-button___NsKQg"}},"c+yx":function(e,t,a){"use strict";(function(e){function n(e){return e&&0!==e.length&&e.trim()}function o(e){return e.charAt(0).toUpperCase()+e.substring(1)}function r(e){var t=document.createElement("textarea");t.value=e,t.style.top="0",t.style.left="0",t.style.position="fixed",document.body.appendChild(t),t.focus(),t.select();try{document.execCommand("copy")}catch(e){console.error(e)}document.body.removeChild(t)}function l(e){navigator.clipboard?navigator.clipboard.writeText(e).then(()=>{console.log("Async: Copying to clipboard was successful!")},e=>{console.error("Async: Could not copy text: ",e)}):r(e)}a.d(t,"c",function(){return n}),a.d(t,"a",function(){return o}),a.d(t,"b",function(){return l})}).call(this,a("tjlA").Buffer)},xhQn:function(e,t,a){"use strict";a.d(t,"c",function(){return n}),a.d(t,"b",function(){return o}),a.d(t,"a",function(){return r});var n="#ffffff",o="#979797",r="#6c72f9"}}]);