export default class VDOMService {
    constructor(realDOM, data){
        this.realDOM = realDOM;
        this.data = data;
        this.convertNode = this.convertNode.bind(this);
    }

    static createVDOM(dynamicVDOM){
        return dynamicVDOM;
    }
    createVDOM(){
        return this.data.vDOM;
    }

    updateDOM(){
        if (this.data.elems == undefined){
            this.data.elems = this.data.vDOM.map(this.convertNode);
            this.realDOM.append(...this.data.elems);
        } else {
            this.data.prevVDOM = [...this.data.vDOM];
            this.data.vDOM = this.createVDOM();
            const patches = this.diff(this.data.prevVDOM, this.data.vDOM);
            this.data.elems = this.patch(this.data.elems, patches);
        }
    }

    diff(prevVDOM, newVDOM){
        const patches = [];
        if(this.data.onlySusceptible){
            this.data.susceptibleIndexes.forEach(i => {
                if (JSON.stringify(prevVDOM[i]) !== JSON.stringify(newVDOM[i])){ 
                    patches.push({index: i, node: newVDOM[i]});
                }
            });
            return patches; 
        } else {
            for (let i = 0; i < Math.max(prevVDOM.length, newVDOM.length); i++){
                const prevNode = prevVDOM[i];
                const newNode = newVDOM[i];
                if(JSON.stringify(prevNode) !== JSON.stringify(newNode)){
                    patches.push({index: i, node: newNode});
                }
            }
            return patches;
        }
       
    }
    patch(elems, patches){
        elems = [...elems];
        patches.forEach(patch => {
            const newEl = this.convertNode(patch.node);
            if (elems[patch.index]){
                elems[patch.index].replaceWith(newEl);
                elems[patch.index] = newEl;
            } else {
                this.realDOM.appendChild(newEl);
                elems[patch.index] = newEl;
            }        
        });
        return elems;
    }




    convertNode(node){
        if (typeof node == "object" && node !== null && node.tag){
            const el = document.createElement(node.tag);
            if (node.className !== undefined){
                el.className = node.className;
            }
            if (node.value !== undefined){
                el.value = node.value;
            }
            if (node.value !== undefined && (node.tag === "button" || node.tag === "label")){
                el.textContent = node.value;
            }
            if (node.placeholder !== undefined){
                el.placeholder = node.placeholder;
            }
            if (node.datatarget !== undefined){
                el.setAttribute("data-target", node.datatarget);
            }
            if (node.id !== undefined){
                el.id = node.id;
            }
            if (node.children !== undefined && Array.isArray(node.children)){ 
                if (node.children.length >= 1){
                    node.children.forEach(child => {
                        el.appendChild(this.convertNode(child));
                    });
                }
            }
            
            return el;
        } else {
            console.error(`SolverHomePage: Invalid node in convertNode: ${node}`);
            return document.createTextNode("");
        }
    }
}