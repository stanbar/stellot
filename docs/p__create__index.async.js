(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[2],{"/sTe":function(e,t,a){"use strict";a.r(t);a("BoS7");var n=a("Sdc0"),r=(a("iQDF"),a("+eQT")),o=(a("giR+"),a("fyUT")),i=(a("DZo9"),a("8z0m")),l=(a("7Kak"),a("9yH6")),c=(a("+L6B"),a("2/Rp")),u=(a("jCWc"),a("kPKH")),s=(a("14J3"),a("BMrR")),d=(a("5NDa"),a("5rEg")),m=(a("miYZ"),a("tsqr")),p=a("d6i3"),h=a.n(p),f=a("1l/V"),b=a.n(f),g=(a("y8nQ"),a("Vl3Y")),E=a("qIgq"),v=a.n(E),y=a("q1tI"),x=a.n(y),O=a("71ry"),w=a("hBab"),z=a("c+yx"),A=a("ih5i"),C=a("/MKj"),I=a("CQ3q"),j=a("LvDl"),S=a.n(j),k=a("NFtC"),B=a.n(k),P=e=>{var t=e.dispatch,a=e.loading,p=g["a"].useForm(),f=v()(p,1),E=f[0],C=Object(y["useState"])(),j=v()(C,2),k=j[0],P=j[1],T=Object(y["useState"])(!1),N=v()(T,2),q=N[0],V=N[1],D=function(){var e=b()(h.a.mark(function e(t,a){return h.a.wrap(function(e){while(1)switch(e.prev=e.next){case 0:e.t0=t,e.next=e.t0===w["Authorization"].KEYBASE?3:e.t0===w["Authorization"].EMAILS?4:e.t0===w["Authorization"].DOMAIN?9:10;break;case 3:return e.abrupt("return",a.authorizationOptions);case 4:return console.log(k),e.next=7,a.authorizationOptions.emails;case 7:return e.t1=e.sent,e.abrupt("return",{emails:e.t1});case 9:return e.abrupt("return",a.authorizationOptions);case 10:return e.abrupt("return",void 0);case 11:case"end":return e.stop()}},e)}));return function(t,a){return e.apply(this,arguments)}}(),R=function(){var e=b()(h.a.mark(function e(a){var n,r,o;return h.a.wrap(function(e){while(1)switch(e.prev=e.next){case 0:return n=a,e.next=3,D(n.authorization,n);case 3:r=e.sent,o={title:n.title,polls:[{question:n.question,options:[n.first,n.second,...n.options||[]].filter(z["d"]).map((e,t)=>({name:e,code:t+1}))}],authorization:n.authorization,authorizationOptions:r,visibility:n.visibility,votesCap:n.votesCap,encrypted:n.encrypted,challenges:n.challenges,startDate:n.period[0],endDate:n.period[1]},console.log({createVoting:o}),Object(A["dispatchCreateVoting"])(t,o);case 7:case"end":return e.stop()}},e)}));return function(t){return e.apply(this,arguments)}}(),L={labelCol:{xs:{span:24},sm:{span:8}},wrapperCol:{xs:{span:24},sm:{span:16}}},F={wrapperCol:{xs:{span:24,offset:0},sm:{span:16,offset:8}}},M=function(){var e=b()(h.a.mark(function e(t){var a,n,r,o,i,l,c;return h.a.wrap(function(e){while(1)switch(e.prev=e.next){case 0:if("done"!==t.file.status){e.next=10;break}return e.next=3,U(t.file);case 3:return a=e.sent,n=S.a.partition(a,z["c"]),r=v()(n,2),o=r[0],i=r[1],l=S.a.uniq(o),c="".concat(o.length!==l.length?"".concat(o.length-l.length," were duplicated and "):"").concat(i.length>0?"following emails were malformed: ".concat(i.join(" ")):""),m["a"].warn(c),P(l),e.abrupt("return",l);case 10:return e.abrupt("return",null);case 11:case"end":return e.stop()}},e)}));return function(t){return e.apply(this,arguments)}}();function U(e){return new Promise((t,a)=>{if(!e.originFileObj)return a(new Error("Origin file object undefined"));var n=new FileReader;return n.readAsText(e.originFileObj),n.onload=(()=>{"string"===typeof n.result?t(n.result.split(/[\n,]/).map(e=>e.trim())):a(new Error("Can not process ArrayBuffer"))}),n.onerror=(e=>a(e)),n})}return x.a.createElement(g["a"],Object.assign({layout:"horizontal"},L,{form:E,name:"options_form",onFinish:R,scrollToFirstError:!0,initialValues:{votesCap:100,authorization:w["Authorization"].OPEN,visibility:w["Visibility"].PUBLIC,encrypted:!1,challenges:100}}),x.a.createElement(g["a"].Item,{name:"title",label:"Title",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},x.a.createElement(d["a"],{placeholder:"Favourite colour"})),x.a.createElement(g["a"].Item,{name:"question",label:"Question",rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}]},x.a.createElement(d["a"],{placeholder:"What is your favourite colour ?"})),x.a.createElement(g["a"].Item,{label:"Options"},x.a.createElement(s["a"],null,x.a.createElement(u["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},"1."),x.a.createElement(u["a"],{flex:"auto"},x.a.createElement(g["a"].Item,Object.assign({},L,{name:"first",key:"first",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0}),x.a.createElement(d["a"],{placeholder:"Blue",style:{marginRight:32}}))))),x.a.createElement(g["a"].Item,Object.assign({},F),x.a.createElement(s["a"],null,x.a.createElement(u["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},"2."),x.a.createElement(u["a"],{flex:"auto"},x.a.createElement(g["a"].Item,{name:"second",key:"second",validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0},x.a.createElement(d["a"],{placeholder:"Red",style:{marginRight:32}}))))),x.a.createElement(g["a"].List,{name:"options"},(e,t)=>{var a=t.add,n=t.remove;return x.a.createElement("div",null,e.map((e,t)=>x.a.createElement(g["a"].Item,Object.assign({},F,{label:"",required:!1,key:e.key}),x.a.createElement(s["a"],null,x.a.createElement(u["a"],{flex:"10px",style:{marginRight:10,alignSelf:"center"}},t+3),x.a.createElement(u["a"],{flex:"auto"},x.a.createElement(g["a"].Item,Object.assign({},e,{validateTrigger:["onChange","onBlur"],rules:[{required:!0,whitespace:!0,message:"Please input option value or delete this field."}],noStyle:!0}),x.a.createElement(d["a"],{placeholder:"Option",style:{marginRight:32}}))),x.a.createElement(u["a"],{flex:"30px",style:{alignSelf:"center",textAlign:"center"}},x.a.createElement(O["MinusCircleOutlined"],{className:B.a.dynamicDeleteButton,onClick:()=>{n(e.name)}}))))),x.a.createElement(g["a"].Item,Object.assign({},F),x.a.createElement(c["a"],{type:"dashed",onClick:()=>{a()}},x.a.createElement(O["PlusOutlined"],null)," Add an option")))}),x.a.createElement(g["a"].Item,{name:"authorization",label:"Authorization method"},x.a.createElement(l["a"].Group,null,x.a.createElement(l["a"].Button,{value:w["Authorization"].OPEN},Object(z["a"])(w["Authorization"].OPEN)),x.a.createElement(l["a"].Button,{value:w["Authorization"].EMAILS},Object(z["a"])(w["Authorization"].EMAILS)),x.a.createElement(l["a"].Button,{disabled:!0,value:w["Authorization"].DOMAIN},Object(z["a"])(w["Authorization"].DOMAIN)),x.a.createElement(l["a"].Button,{disabled:!0,value:w["Authorization"].CODE},Object(z["a"])(w["Authorization"].CODE)),x.a.createElement(l["a"].Button,{value:w["Authorization"].KEYBASE},Object(z["a"])(w["Authorization"].KEYBASE)))),x.a.createElement(g["a"].Item,{noStyle:!0,shouldUpdate:(e,t)=>e.authorization!==t.authorization},e=>{var t=e.getFieldValue;return{[w["Authorization"].KEYBASE]:x.a.createElement(g["a"].Item,{name:["authorizationOptions","team"],label:"(Optional) Team membership",rules:[{whitespace:!0,message:"Please input option value or delete this field."}]},x.a.createElement(d["a"],{placeholder:"stellar.public"})),[w["Authorization"].EMAILS]:x.a.createElement(g["a"].Item,{rules:[{required:!0,message:"You need to upload the file with eligible email addresses"}],name:["authorizationOptions","emails"],label:"Emails",valuePropName:"emails",getValueFromEvent:M,extra:k?"Uploaded file with ".concat(k.length," emails"):"Please upload file with eligible email addresses separated with new line or comma"},x.a.createElement(i["a"],{multiple:!1,name:"logo",accept:".csv, text/plain",listType:"text"},x.a.createElement(c["a"],null,x.a.createElement(O["UploadOutlined"],null)," Click to upload"))),[w["Authorization"].OPEN]:null}[t("authorization")]}),x.a.createElement(g["a"].Item,{name:"visibility",label:"Listing visibility"},x.a.createElement(l["a"].Group,null,x.a.createElement(l["a"].Button,{value:w["Visibility"].PUBLIC},Object(z["a"])(w["Visibility"].PUBLIC)),x.a.createElement(l["a"].Button,{value:w["Visibility"].UNLISTED},Object(z["a"])(w["Visibility"].UNLISTED)),x.a.createElement(l["a"].Button,{value:w["Visibility"].PRIVATE},Object(z["a"])(w["Visibility"].PRIVATE)))),x.a.createElement(g["a"].Item,{label:"Number of votes cap",name:"votesCap",rules:[{validator:(e,t)=>{return k&&t<k.length?Promise.reject(new Error("The value is less than total number of email addresses eligible to cast a vote")):Promise.resolve()}}],shouldUpdate:(e,t)=>e.votesCap!==t.votesCap},x.a.createElement(o["a"],{min:2})),x.a.createElement(g["a"].Item,{name:"period",label:"Select time period",rules:[{type:"array",required:!0,message:"Please select time!"}]},x.a.createElement(r["a"].RangePicker,null)),!q&&x.a.createElement(g["a"].Item,Object.assign({},F),x.a.createElement("a",{style:{fontSize:12},onClick:()=>{V(!0)}},x.a.createElement(O["DownOutlined"],null)," Show advanced")),x.a.createElement(g["a"].Item,{name:"encrypted",label:"Encrypt partial results",valuePropName:"checked",style:{display:q?"":"none"}},x.a.createElement(n["a"],null)),x.a.createElement(g["a"].Item,{label:"Security level",style:{display:q?"":"none"}},x.a.createElement(g["a"].Item,{name:"challenges",noStyle:!0},x.a.createElement(o["a"],{min:2,max:500}))),x.a.createElement(g["a"].Item,Object.assign({},F),x.a.createElement(I["d"],{size:"large",type:"primary",htmlType:"submit",loading:a},a?"Creating...":"Create")))};t["default"]=Object(C["c"])(e=>{var t=e.loading;return{loading:t.effects["".concat(A["CREATE"],"/").concat(A["CREATE_VOTING"])]}})(P)},CQ3q:function(e,t,a){"use strict";a.d(t,"a",function(){return h}),a.d(t,"c",function(){return f}),a.d(t,"d",function(){return b}),a.d(t,"b",function(){return g});a("+L6B");var n=a("2/Rp"),r=a("fFZ8"),o=a.n(r),i=a("vOnD"),l=a("xhQn");function c(){var e=o()(["\n  background-color: #00000000;\n  color: ",";\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n"]);return c=function(){return e},e}function u(){var e=o()(["\n  background-color: ",";\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n"]);return u=function(){return e},e}function s(){var e=o()(["\n  background-color: ",";\n  color: ",";\n  border-color: ",";\n  float: right;\n  border: 1px solid;\n  width: 150px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    opacity: 0.5;\n    cursor: default;\n  }\n  &:hover {\n    color: ",";\n    background-color: #00000000;\n    border-color: ",";\n  }\n"]);return s=function(){return e},e}function d(){var e=o()(["\n  background-color: ",";\n  color: ",";\n  border-color: ",";\n  float: right;\n  width: 120px;\n  font-size: 16px;\n  padding: 10px 0;\n  &:disabled {\n    background: ",";\n    opacity: 0.6;\n    pointer-events: none;\n    cursor: default;\n  }\n  &:hover {\n    color: ",";\n    background-color: ",";\n  }\n"]);return d=function(){return e},e}function m(){var e=o()(["\n  background-color: ",";\n  border-radius: 5px;\n  border: 0;\n  color: ",";\n  cursor: pointer;\n  font-family: 'Clear Sans Bold','Nitti Grotesk','Museo Sans','Helvetica Neue',Verdana,Arial,sans-serif;\n  font-size: 18px;\n  font-weight: 500;\n  line-height: initial;\n  padding: 14px 0 18px 0;\n  &:hover {\n    opacity: 0.8;\n  }\n  &:focus {\n    outline: 0;\n  }\n"]);return m=function(){return e},e}var p=Object(i["a"])(n["a"])(m(),l["a"],l["c"]),h=Object(i["a"])(p)(d(),e=>e.color?e.color:l["a"],l["c"],e=>e.color?e.color:l["a"],l["b"],l["c"],e=>e.color?e.color:l["a"]),f=Object(i["a"])(p)(s(),l["c"],e=>e.color?e.color:l["a"],e=>e.color?e.color:l["a"],e=>e.color?e.color:l["a"],e=>e.color?e.color:l["a"]),b=Object(i["a"])(p)(u(),e=>e.color?e.color:l["a"]),g=Object(i["a"])(p)(c(),e=>e.color?e.color:l["a"])},NFtC:function(e,t,a){e.exports={"dynamic-delete-button":"dynamic-delete-button___NsKQg"}},"c+yx":function(e,t,a){"use strict";(function(e){function n(e){return e&&0!==e.length&&e.trim()}function r(e){return e.charAt(0).toUpperCase()+e.substring(1)}function o(e){var t=document.createElement("textarea");t.value=e,t.style.top="0",t.style.left="0",t.style.position="fixed",document.body.appendChild(t),t.focus(),t.select();try{document.execCommand("copy")}catch(e){console.error(e)}document.body.removeChild(t)}function i(e){navigator.clipboard?navigator.clipboard.writeText(e).then(()=>{console.log("Async: Copying to clipboard was successful!")},e=>{console.error("Async: Could not copy text: ",e)}):o(e)}a.d(t,"d",function(){return n}),a.d(t,"a",function(){return r}),a.d(t,"b",function(){return i}),a.d(t,"c",function(){return l});var l=e=>e.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}).call(this,a("HDXh").Buffer)},xhQn:function(e,t,a){"use strict";a.d(t,"c",function(){return n}),a.d(t,"b",function(){return r}),a.d(t,"a",function(){return o});var n="#ffffff",r="#979797",o="#6c72f9"}}]);