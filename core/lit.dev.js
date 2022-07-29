/*
JS Author: OHYOO INC
All rights reserved
Ohyoo 2022
 */
'use strict';
self.dataLit = null;
class LitGirl{
    constructor(conf = null){//conf.data || conf.dataUrl *[conf.dataName], *[conf.output, conf.method, rootDir]
        this.rootLit = (conf.rootDir != null) ? conf.rootDir+'/litgirl' : 'litgirl';
        this.urlBase = `${location.protocol}//${location.host}/${this.rootLit}/`;
        this.string = null;
        this.data = (conf && conf.data != null) ? conf.data : null;
        if(!this.data){
            if(conf && conf.dataUrl){
                this.getModule(conf.dataUrl.url, null, conf.dataUrl.name)
                .then(data => {
                    this.data = data;
                })
                .catch(err => {console.error(`Loading Error in ${conf.dataUrl.url}:\n ${err}`)});
            }
            /*
            Esto me parece redundante. Para qué quiero guardar datos que hago gllobales en privado. Es ineficiente. Además el objetivo de 'data' es mantener datos encapsulados dentro de Lit y con est6o los estoy haciendo globales.
            else if(self.dataLit){
                this.data = self.dataLit;
            }
            */
        }
        this.output = (conf && conf.output) ? conf.output : null;
        this.method = (conf && conf.method) ? conf.method : null;
        this.operators = ['===', '==', '!=', '!==', '<', '>', '<=', '>=', '<>', '&&', '||', '!', '<|>', '=', '+', '++', '-', '--', '*', '**', '/', '%'];
        this.urlParts = (conf && conf.urlParts  && conf.urlParts.startsWith(/http|\./)) ? conf.urlParts+'/' : `${this.urlBase}parts/`;
        this.urlSrc = (conf && conf.urlSrc) ? conf.urlSrc+'/' : '../src/';
        this.modules = {};
        this.regCarry = /{{\=([\s\S]+?)\}}/g;
    }
    async setDataLit(referData = null){
        try{
            if(!referData){
                referData = {};
            }
            if(referData.get !== false){
                if(!referData.get.url && referData.get.file)
                    referData.get.url = `${this.urlSrc}${referData.get.file}`;
                else if(!referData.get.url && !referData.get.file)
                    referData.get.url = `${this.urlSrc}datalit.js`;
                else referData.get.url = `${referData.get.url}/${referData.get.file}`;
                if(!referData.get.name)
                    referData.get.name = 'default';
                this.getModule(referData.get.url, null, referData.get.name)
                .then(modules => {
                    if(dataLit && referData.add === true){
                        datalit = (referData.set && referData.set.data) ? Object.assign(datalit, modules, referData.set.data) : Object.assign(datalit, modules);
                    }
                    else
                        datalit = (referData.set && referData.set.data) ? Object.assign(modules, referData.set.data) : modules;

                    if(referData.replicate === true)
                            this.data = dataLit;
                    return dataLit;
                })
                .catch(err => {
                    console.log(err.message);
                });
            }else if(referData.set && referData.set.data){
                if(dataLit && referData.add === true){
                    datalit = Object.assign(datalit, referData.set.data);
                }
                else
                    datalit = referData.set.data;

                if(referData.replicate === true)
                        this.data = dataLit;
                return dataLit;
            }
            return console.log(`CLOSED PROCEDURE WITH ERROR: An incongruence has ocurred trying to process arguments object`);
        }
        catch(err){
            console.error(`Loading error data: ${err}`);
            return false;
        }
    }
    async init(baseUrl = null, conf = null){
            const  head = document.documentElement.querySelector('head');
            const body = document.documentElement.querySelector('body');
            if(body == null){
                while(!body || body == undefined){
                    if(body != null){
                        body.style.visibility = 'hidden';
                        break;
                    }
                }
            }
            else
                body.style.visibility = 'hidden';
            //baseUrl = (baseUrl) ? baseUrl : this.urlDefault;
            const parts = [head.innerHTML.match(this.regCarry), body.innerHTML.match(this.regCarry)];
            for(let i = 0; i < parts.length; i++){
                if(parts[i]){
                    this.carry(parts[i], baseUrl)
                    .then(res => {
                        if(!conf){
                            conf = {
                                data: null,
                                output: (i === 0) ? 'head' : 'body',
                                method: 'inner',
                                url: null
                            }
                        }
                        conf.cast = res;
                        return this.compile(conf);
                    });
                }
            }


                /*else{
                    if(howInsert === 'html')
                        this.getComponent(`${baseUrl}${compose}.html`, ...args)
                    else this.getModule(`${baseUrl}${compose}.js`, ...args)
                }*/
                if(parts.some(el => el != null)){
                    const config = { attributes: true, childList: true, subtree: true };

                    // Callback function to execute when mutations are observed
                    const callback = function(mutationList, observer) {
                        // Use traditional 'for loops' for IE 11
                        for(const mutation of mutationList) {
                            if (mutation.type === 'childList') {
                                console.log('A child node has been added or removed.');
                            }
                            else if (mutation.type === 'attributes') {
                                console.log('The ' + mutation.attributeName + ' attribute was modified.');
                            }
                        }
                        observer.disconnect();
                        return document.body.style.visibility = 'visible';
                    };

                    // Create an observer instance linked to the callback function
                    const observer = new MutationObserver(callback);

                    // Start observing the target node for configured mutations
                    observer.observe(body, config);

                    // Later, you can stop observing
                    //observer.disconnect();
                }
                return;
            //});
    }

    async carry(part = null, url = null){
        let compose = null;
        let component = null;
        let parse = '';
        const pr = new Promise ((resolve, reject) => {
            try{
                part.map(async (el, i) => {
                //compose = el.replace('{{=', '').replace('}}', '').trim();
                compose = el.replace(/{{=|}}/g, '').trim();
                compose = compose.split(/\?|#/);
                const extension = this.fileExtension(compose[0]);
                if(extension != null){
                    if(extension.test(/.html|.htm/))
                        component = await this.getComponent(`${url || this.urlParts}${compose}`);
                    else if(extension.test(/.js|.json/))
                        component = await this.getModule(`${url || this.urlSrc}${compose}`);
                    }
                    else{
                        component = await this.getComponent(`${url || this.urlParts}${compose}.html`)
                        .then(response => {
                            if(!response){
                                return this.getModule(`${url || this.urlSrc}${compose}.js`);
                            }
                            else return response;
                        });
                    }
                    if(component != null)
                        parse += part[i].replace(el, component);
                    else  parse += undefined;
                    if(i === part.length - 1)
                        return resolve(parse);
                });
            }
            catch(reason){
                return reject(reason);
            }
        });
        return pr.then(resolve => resolve)
        .catch(reject => reject);
    }

    fileExtension(fileName = null){
        return (/[.]/.exec(fileName)) ? /[^.]+$/.exec(fileName)[0] : undefined;
    }

    async getModule(url = null, name = null, compileConf = null){
        if(!url) return console.error('An Valid URL o file name with extension is required');

        url = (url.startsWith(/http|\./)) ? url : `${this.urlSrc}${url}`;
        return import(url)
            .then(modules => {
                if(!modules){
                    return false;
                }
                if(name && Array.isArray(name)){
                    for(let mod of name){
                        if(mod === 'default') this.modules.default = modules.default;
                        else this.modules[mod] = modules[mod];
                    }
                }
                else{
                    if(!name || name === 'default')
                        this.modules.default = modules.default;
                    else
                        /*if(name === 'default')
                            this.modules.default = modules.default;
                        else*/
                        this.modules[name] = modules;
                }
                if(compileConf && compileConf.cast === true){
                    compileConf.cast = this.modules;
                    return this.compile(compileConf);
                }
                else
                    return this.modules;
            })
            .catch(err => new Error(`Loading error: ${err}`));
    }

    async getComponent(url = null, compileConf = null){
        if(!url) return console.error('An Valid URL o file name with extension is required');

        url = (url.startsWith(/http|\./)) ? url : `${this.urlParts}${url}`;
        //console.log(url)
        const $headers = new Headers({
            'Accept': 'text/html'
        });
        return fetch(url,{
            method: 'GET',
            mode: 'cors',
            cache: 'default',
            credentials: 'omit',
            headers: $headers,
            redirect: 'follow',
            referrerPolicy: 'origin'
        })
        .then(response => {
            if(!response.ok)
                return false;
            return response.text()
        })
        .then(component => {
            //this.string = component
            if(compileConf && compileConf.cast === true){
                compileConf.cast = component;
                return this.compile(compileConf);
            }
            else
            return component;
        })
        .catch(err => console.error(`Loading error: ${err}`));
    }
    compile(conf = null){//string =  null, data = null, output = null, method = null
        try{
            if(conf.data) this.data = conf.data;
            if(conf.output) this.output = conf.output;
            if(conf.method) this.method = conf.method;
            conf.cast = conf.cast.replace(/\n|\r\n/g, '');
            const contExtern = conf.cast.match(this.regCarry) || null;
            if(contExtern){
                contExtern.map(el => {
                    this.carry(el, conf.url || null)
                    .then(res => {
                        if(!res){
                            conf.cast = conf.cast.replace(el, 'unknow');
                        }else{
                            conf.cast = conf.cast.replace(el, res);
                        }
                    });
                })
            }
            this.string = (conf.cast) ? conf.cast : this.string.replace(/\n|\r\n/g, '') ;
            return this.parserString();
        }
        catch(err){
            return console.error(err);
        }

    }

    parserString(){
        try{
            //const dataKeys = Object.keys(this.data);
            //const reg = /{\=([\s\S]+?)\}/g; //|{\%([\s\S]+?)\}|<\?([\s\S]+?)\?>
            let reg = /{=([\s\S]+?)\}/g;
            let matches = this.string.match(reg);
            matches.map((el, i) => {
                let pear = el.replace(/{=|}/g, '').trim();
                this.string = this.string.replaceAll(el, eval(`this.data.${pear}`));
            });
            /*for(let key of dataKeys){
                console.log(eval(`this.data.${key}`))
                let reg = new RegExp(`{=\\s+${key}}`, 'g');
                this.string = this.string.replaceAll(reg, eval(`this.data.${key}`));
            }*/
            const exp = /{\>>([\s\S]+?)\}/g;
            const finders = this.string.match(exp);
            if(finders)
                this.conditions(finders)
            return this.render();
        }
        catch(err){
            return console.error(err);
        }
    }

    conditions(finders = null){
        finders.map(t => {
            t.replace(new RegExp(`\\t`, 'g'), '')
            let extract = t.replace('{>>', '').replace('>>}', '')
            extract = extract.trim();
            if(!extract.startsWith('role=')){
                let stat = extract.split('>>');
                for(let i = 0; i < stat.length; i++){
                    let ev = null;
                    if(!stat[i].includes('out$>')){
                        ev = stat[i].split('$>');
                        ev[0] = ev[0].trim();
                        if (ev[0].startsWith('(') && ev[0].endsWith(')'))
                            ev[0] = (ev[0].slice(1,-1)).trim();
                        /*ev[0] =  ev[0].replace(/\(|\)/g, '').trim(); //Esta era la forma anterior pero eliminaba todos los parentesis*/
                        let parser = ev[0].split(/\s/);
                        let parts = [];
                        for(let p = 0; p < parser.length; p++){
                            if(!parser[p].startsWith('dataLit')){
                                if(!parser[p].includes('$_') && !this.operators.includes(parser[p])){
                                    if(!parser[p].includes('this.data') && !parseInt(parser[p]))
                                        parts.push(`this.data.${parser[p]}`);
                                    else  parts.push(parser[p]);
                                    continue;
                                }
                                parts.push(parser[p]);
                                continue;
                            }
                            parts.push(parser[p]);
                        }
                        parts = parts.join('')
                        ev[0] = `(${parts})`;
                    }
                    if(stat[i].includes('out$>')){
                        ev = stat[i].replace('out$>', '').trim();
                        this.helperEval(t, ev);
                        break;
                    }
                    if(eval(ev[0])){
                        this.helperEval(t, ev[1]);
                        break;
                    }
                }
            }
            else{
                this.listExecute(t, extract);
            }
            return;
        });
    }

    listExecute(t = null, ev = null){
        ev = ev.trim().replace('role=', '');
        if(!ev.includes('=>')){
            ev = ev.split('$>');
            this.helperList(t, ev);
        }
        else{
            ev = ev.split('=>');
            //ev[0] = ev[0].replace(/\(|\)|\s/g, '').split('->');
            //ev[0][0] = ev[0][0].trim();
            //ev[0][1] = ev[0][1].trim();
            ev[1] = ev[1].replace(new RegExp(`\\t`, 'g'), '');
            ev[1] = ev[1].split('>>');
            let arrParsers = [];
            for(let i = 0; i < ev[1].length; i++){
                ev[1][i] = ev[1][i].split('$>');
                ev[1][i][0] = ev[1][i][0].trim();
                ev[1][i][1] = ev[1][i][1].trim();
                if(ev[1][i][0] !== 'default'){
                    ev[1][i][0] = ev[1][i][0].replace(/\(|\)/g, '');
                    let parser = ev[1][i][0].split(/\s/);
                    let parts = [];
                    for(let p = 0; p < parser.length; p++){
                        if(!parser[p].startsWith('dataLit')){
                            if(!parser[p].includes('$_') && !this.operators.includes(parser[p])){
                                if(!parser[p].includes('this.data') && !parseInt(parser[p]))
                                    parts.push(`this.data.${parser[p]}`);
                                else  parts.push(parser[p]);
                                continue;
                            }
                            parts.push(parser[p]);
                            continue;
                        }
                        parts.push(parser[p]);
                    }
                    parts = parts.join('')
                    arrParsers.push([`(${parts})`, ev[1][i][1]]);
                    continue;
                }
                arrParsers.push([ev[1][i]]);
            }
            this.helperList(t, [ev[0], arrParsers], true);
        }
    }

    helperList(t = null, ev = null, exec = null){
        let list = '';
        if(!exec)
            ev[1] = ev[1].trim().replace(new RegExp(`\\t`, 'g'), '');
        ev[0] = ev[0].replace(/\(|\)|\s/g, '').split('->');
        ev[0][0] = ev[0][0].trim();
        ev[0][1] = ev[0][1].trim();
        if(ev[0][1] != null && ev[0][1] != ""){
            if(ev[0][1].startsWith('[')){
                ev[0][1] = ev[0][1].replace(/\[|\]|\s/g, '');
                ev[0][1] = ev[0][1].split(',');
            }
        }

        if(ev[0][0].startsWith('[')){
            ev[0][0] = ev[0][0].replace(/\[|\]|\s/g, '');
            ev[0][0] = ev[0][0].split(',');
        }
        else if(parseInt(ev[0][0]))
            ev[0][0] = parseInt(ev[0][0]);

        if(ev[0][0] instanceof Array){ // funciona
            for(let ind of ev[0][0]){
                let result = null;
                let toEval = null;
                let isDefault = null;
                if(ind.includes('.') || !parseInt(ind)){
                    if(!exec)
                        result = this.helperArrays([`${ev[0][1]}.${ind}`]);
                    else{
                        for(let i = 0; i < ev[1].length; i++){
                            if(ev[1][i][0].includes('[i]')){
                                ev[1][i][0] = ev[1][i][0].replace('[i]', `[${ind}]`);
                            }
                            if(ev[1][i][0].includes('default')){
                                result = this.helperEval(null, ev[1][i][1], 'get');
                                isDefault = true;
                                break;
                            }
                            if(eval(ev[1][i][0])){
                                result = this.helperArrays([`${ev[0][1]}.${ind}`]);
                                toEval = ev[1][i][1];
                                break;
                            }
                        }
                    }
                }
                else{
                    if(!exec)
                        result = this.helperArrays([ev[0][1]], ind);
                    else{
                        for(let i = 0; i < ev[1].length; i++){
                            if(ev[1][i][0].includes('[i]')){
                                ev[1][i][0] = ev[1][i][0].replace('[i]', `[${ind}]`);
                            }
                            if(ev[1][i][0].includes('default')){
                                result = this.helperEval(null, ev[1][i][1], 'get');
                                isDefault = true;
                                break;
                            }
                            if(eval(ev[1][i][0])){
                                result = this.helperArrays([ev[0][1]], ind);
                                toEval = ev[1][i][1];
                                break;
                            }
                        }
                    }
                }
                if(!exec)
                    list += this.helperEval(null, ev[1], result);
                else{
                    list += (!isDefault) ? this.helperEval(null, toEval, result) : result;
                }
            }
        }
        else if(typeof ev[0][0] === "number"){
            for(let i = 0; i <= ev[0][0]; i++){
                let isResolved = null;
                if(ev[0][1] instanceof Array){
                    if(!exec){
                        list += this.helperEval(null, ev[1], this.helperArrays(ev[0][1], i));
                        continue;
                    }
                    for(let id = 0; id < ev[1].length; id++){
                        if(ev[1][id][0].includes('[i]')){
                            ev[1][id][0] = ev[1][id][0].replace('[i]', `[${i}]`);
                        }
                        if(ev[1][id][0].includes('default')){
                            list += this.helperEval(null, ev[1][id][1], 'get');
                            isResolved = true;
                            break;
                        }
                        if(eval(ev[1][id][0])){
                            list += this.helperEval(null, ev[1][id][1], this.helperArrays(ev[0][1], i));
                            isResolved = true;
                            break;
                        }
                    }
                }
                else if(ev[0][1].includes('.')){
                    if(!exec){
                        list += this.helperEval(null, ev[1], this.helperArrays([ev[0][1]], i));
                        continue;
                    }
                    for(let id = 0; id < ev[1].length; id++){
                        if(ev[1][id][0].includes('[i]')){
                            ev[1][id][0] = ev[1][id][0].replace('[i]', `[${i}]`);
                        }
                        if(ev[1][id][0].includes('default')){
                            list += this.helperEval(null, ev[1][id][1], 'get');
                            isResolved = true;
                            break;
                        }
                        if(eval(ev[1][id][0])){
                            list += this.helperEval(null, ev[1][id][1], this.helperArrays([ev[0][1]], i));
                            isResolved = true;
                            break;
                        }
                    }
                }
                if(!isResolved)
                    list += this.helperEval(null, ev[1], this.data[ev[0][1]][i]);
            }
        }
        else if(ev[0][0].includes('..')){ // este ya funciona
            ev[0][0] = ev[0][0].trim().split('..');
            ev[0][0][0] = parseInt(ev[0][0][0].trim());
            ev[0][0][1] = parseInt(ev[0][0][1].trim());
            for(let i = ev[0][0][0]; i <= ev[0][0][1]; i++){
                let isResolved = null;
                if(ev[0][1] instanceof Array){
                    if(!exec){
                        list += this.helperEval(null, ev[1], this.helperArrays(ev[0][1], i));
                        continue;
                    }
                    for(let id = 0; id < ev[1].length; id++){
                        if(ev[1][id][0].includes('[i]')){
                            ev[1][id][0] = ev[1][id][0].replace('[i]', `[${i}]`);
                        }
                        if(ev[1][id][0].includes('default')){
                            list += this.helperEval(null, ev[1][id][1], 'get');
                            isResolved = true;
                            break;
                        }
                        if(eval(ev[1][id][0])){
                            list += this.helperEval(null, ev[1][id][1], this.helperArrays(ev[0][1], i));
                            isResolved = true;
                            break;
                        }
                    }
                }
                if(!isResolved)
                    list += this.helperEval(null, ev[1], this.data[ev[0][1]][i]);
            }
        }
        else{
            if(ev[0][1] instanceof Array){ //ya funciona
                for(let i = 0; i < this.helperLength(ev[0][1]); i++){
                    if(!exec){
                        list += this.helperEval(null, ev[1], this.helperArrays(ev[0][1], i));
                        continue;
                    }
                    for(let id = 0; id < ev[1].length; id++){
                        if(ev[1][id][0].includes('[i]')){
                            ev[1][id][0] = ev[1][id][0].replace('[i]', `[${i}]`);
                        }
                        if(ev[1][id][0].includes('default')){
                            list += this.helperEval(null, ev[1][id][1], 'get');
                            break;
                        }
                        if(eval(ev[1][id][0])){
                            list += this.helperEval(null, ev[1][id][1], this.helperArrays(ev[0][1], i));
                            break;
                        }
                    }
                }
            }
            else{
                if(ev[0][1].includes('.')){
                    ev[0][1] = this.helperArrays([ev[0][1]])[0];
                }
                for(let i of ev[0][1]){
                    if(!exec){
                        list += this.helperEval(null, ev[1], i);
                        continue;
                    }
                    for(let id = 0; id < ev[1].length; id++){
                        if(ev[1][id][0].includes('[i]')){
                            ev[1][id][0] = ev[1][id][0].replace('[i]', `[${i}]`);
                        }
                        if(eval(ev[1][id][0]) || ev[1][id][0].includes('default')){
                            list += this.helperEval(null, ev[1][id][1], i);
                            break;
                        }
                    }
                }
            }
        }
        return this.helperEval(t, list);
    }

    helperLength(arr = null, ref = null){
        let size = 0;
        for (let i = 0; i < arr.length; i++){
            let arrKey = null;
            let valueOf = null;
            if(arr[i].includes('.')){
                arrKey = arr[i].split('.');
                arrKey.map(k => {
                    if(!valueOf)
                        return valueOf = this.data[k];
                    return valueOf = valueOf[k];
                });
            }
            else valueOf = this.data[arr[i]];

            if(Array.isAisArray(valueOf)){
                if(!ref || ref === 'max')
                    size = (valueOf.length > size) ? valueOf.length : size;
                else size = (valueOf.length < size) ? valueOf.length : size;
            }
        }
        return size;
    }
    helperArrays(arr = null, index = null){
        let arrValues = [];
        for(let key of arr){
            let objKey = null;
            let objValue = null;
            if(key === 'dataLit')
                objValue = this.data;
            if(key.includes('.')){
                objKey = key.split('.');
                objKey.map(k => {
                    if(k !== 'dataLit'){
                        if(!objValue)
                            return objValue = this.data[k];
                        return objValue = objValue[k];
                    }
                });
            }
            if(index !== null){
                if(objValue){
                    if(objValue[index] != null){
                        arrValues.push(objValue[index]);
                        continue;
                    }
                    arrValues.push(null);
                    continue;
                }
                arrValues.push(this.data[key][index]);
                continue;
            }
            else{
                if(!objValue)
                    arrValues.push(this.data[key]);
                else{
                    arrValues.push(objValue);
                }
            }
        }
        return arrValues;
    }

    helperEval(t = null, ev = null, back = null){
            if(ev.includes('[[') && ev.includes(']]')){
                let parseReg = /\[\[([\s\S]+?)\]\]/g;
                ev.match(parseReg).map((e, i) => {
                    if(back && !Array.isArray(back) && back !== 'get')
                        return ev = ev.replace(e, back);
                    else if (back instanceof Array && back !== 'get')
                        return ev = ev.replace(e, back[i]);

                    let extract = e.replace(/\[\[|\]\]/g, '').trim();
                    let dataPairing = null;
                    if(extract.includes('dataLit')){
                        dataPairing = eval(extract);
                    }
                    else if(extract.includes('.')){
                        extract = extract.split('.');
                        dataPairing = this.data;
                        for(let par of extract){
                            dataPairing = dataPairing[par];
                        }
                    }
                    console.log(dataPairing)
                    return ev = ev.replace(e, `${dataPairing}`);
                });

            }
            if(back)
                return ev;
            return this.string = this.string.replace(t, ev);
        }

    render(){
        try{
            if(!this.output){
                return this.getResult;
            }
            if(Array.isArray(this.output)){
                for(let key of this.output){
                    if(this.output[key].recursive && this.output[key].recursive !== undefined){
                        document.querySelectorAll(this.output[key].target).forEach(el => {
                            if(this.output[key].method !== undefined)
                                this.helperInsert(el, this.output[key].method);
                            else this.helperInsert(el, this.method);
                        });
                    }
                    else{
                        if(this.output[key].method !== undefined)
                            this.helperInsert(document.querySelector(this.output[key].target), this.output[key].method);
                        else this.helperInsert(document.querySelector(this.output[key].target), this.method);
                    }
                }
            }
            else if(this.output && this.method)
                this.helperInsert(document.querySelector(this.output), this.method);
            else this.helperInsert(document.querySelector('body'), 'beforeend');

        }
        catch(err){
            return console.error(err);
        }
    }

    helperInsert(el = null, pos = null){
        try{
            if(!pos || pos === 'inner')
                return el.innerHTML = this.string;
            else return el.insertAdjacentHTML(pos, this.string);
        }
        catch(err){
            return console.error(err);
        }
    }

    get getResult(){
        return this.string;
    }
     /*compile(string = null, data = null) {
         if(!data)
            data = this.data;
       string = string.replace(/\n|\r\n/g, '');
       console.log(string)
       function esacper(str) {
         const keyMap = {
           '&': '&amp;',
           '<': '&lt;',
           '>': '&gt;',
           '"': '&quot;',
           "'": '&hx27;',
           '`': '&#x660;',
         };

         const keys = Object.keys(keyMap);

         const reg = new RegExp(`(?:${keys.join('|')})`, 'g');

         const replace = (value) => {
           return keyMap[value];
         };

         return reg.test(str) ? str.replace(reg, replace) : str;
       }

       function render() {
         let str = '';
         str += esacper.toString();
         str += "var _p = '';";
         str += 'with(data){';
         str += '_p +=';
         str = templateParse(str);
         str += ';}return _p;';
         return str;
       }

       function templateParse(str) {
         const reg = /<\?=([\s\S]+?)\?>|<\?-([\s\S]+?)\?>|<\?([\s\S]+?)\?>/g;
         let index = 0;
         string.replace(reg, function (matches, $1, $2, $3, offset) {
           str += "'" + string.slice(index, offset) + "'";
           if ($1) {
             str += '+';
             str += $1;
             str += '+';
           } else if ($2) {
             str += '+ esacper(' + $2 + ') +';
           } else if ($3) {
             str += ';';
             str += $3;
             str += '_p+=';
           }
           index = offset + matches.length;
         });
         str += "'" + string.slice(index) + "'";
         return str;
       }

       const template_str = render();
       const fn = new Function(data, template_str);

       return fn;
     }*/
}

export {LitGirl as Lit}
