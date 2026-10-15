"use strict";
const INITIAL_CLIENTS = [
 {id:1,name:"João",phone:"(82) 3638-7156"},
 {id:2,name:"Pedro",phone:"(67) 3082-7033"},
 {id:3,name:"Ana",phone:"(67) 2107-7336"},
 {id:4,name:"Mario",phone:"(69) 3481-1565"},
 {id:5,name:"Diego",phone:"(79) 3784-1847"}
];
const INITIAL_PRODUCTS = [
 {id:1,name:"Morango",price:10,stock:20},
 {id:2,name:"Maçã",price:20,stock:20},
 {id:3,name:"Melancia",price:50,stock:20},
 {id:4,name:"Banana",price:30,stock:20},
 {id:5,name:"Pera",price:20,stock:20},
 {id:6,name:"Laranja",price:40,stock:20},
 {id:7,name:"Kiwi",price:70,stock:20}
];
const STORAGE_KEY = "frutafin_simulador_v1";
const money = n => (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const today = () => {const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const escapeHTML = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadState(){
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const s=JSON.parse(raw);if(Array.isArray(s.clients)&&Array.isArray(s.products)&&Array.isArray(s.purchases))return s;}}catch(e){}
 return {clients:INITIAL_CLIENTS.map(x=>({...x})),products:INITIAL_PRODUCTS.map(x=>({...x})),purchases:[],nextPurchaseId:1};
}
let state=loadState();
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast("Não foi possível salvar neste navegador. Verifique as configurações de armazenamento.");}}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200);}
function getClient(id){return state.clients.find(c=>c.id===Number(id));}
function getProduct(id){return state.products.find(p=>p.id===Number(id));}
function activePurchases(){return state.purchases.filter(p=>p.payment!=="Cancelado");}
function total(p){return p.price*p.qty;}
function showView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===name));const labels={dashboard:"Painel financeiro",compras:"Registrar compra",historico:"Histórico e relatórios",clientes:"Clientes",produtos:"Produtos e estoque"};document.getElementById("page-title").textContent=labels[name]||"Simulador";if(name==="historico")renderHistory();if(name==="produtos")renderProducts();if(name==="clientes")renderClients();window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll(".nav button").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
function fillSelects(){
 const opts=state.clients.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} (ID ${c.id})</option>`).join("");
 document.getElementById("buy-client").innerHTML=opts||'<option value="">Cadastre um cliente</option>';
 document.getElementById("filter-client").innerHTML='<option value="">Todos os clientes</option>'+opts;
 const prods=state.products.map(p=>`<option value="${p.id}">${escapeHTML(p.name)} — ${money(p.price)}</option>`).join("");
 document.getElementById("buy-product").innerHTML=prods||'<option value="">Nenhum produto</option>';
 document.getElementById("filter-product").innerHTML='<option value="">Todos os produtos</option>'+state.products.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("");
}
function updatePurchasePreview(){
 const p=getProduct(document.getElementById("buy-product").value),qty=Math.max(0,Number(document.getElementById("buy-qty").value)||0);
 document.getElementById("sum-product").textContent=p?p.name:"—";
 document.getElementById("sum-price").textContent=p?money(p.price):money(0);
 document.getElementById("sum-qty").textContent=qty;
 document.getElementById("sum-total").textContent=money(p?p.price*qty:0);
 document.getElementById("buy-stock").value=p?`${p.stock} unidade(s)`:"—";
 document.getElementById("buy-qty").max=p?p.stock:1;
}
document.getElementById("buy-product").addEventListener("change",updatePurchasePreview);
document.getElementById("buy-qty").addEventListener("input",updatePurchasePreview);
document.getElementById("buy-date").value=today();
document.getElementById("purchase-form").addEventListener("submit",e=>{
 e.preventDefault();
 const client=getClient(document.getElementById("buy-client").value),product=getProduct(document.getElementById("buy-product").value);
 const qty=Number(document.getElementById("buy-qty").value),date=document.getElementById("buy-date").value,payment=document.getElementById("buy-payment").value,notes=document.getElementById("buy-notes").value.trim();
 if(!client||!product){toast("Selecione um cliente e um produto válidos.");return;}
 if(!Number.isInteger(qty)||qty<1){toast("A quantidade deve ser um número inteiro maior que zero.");return;}
 if(qty>product.stock){toast(`Estoque insuficiente. Disponível: ${product.stock} unidade(s).`);return;}
 if(!date){toast("Informe a data da compra.");return;}
 product.stock-=qty;
 state.purchases.unshift({id:state.nextPurchaseId++,clientId:client.id,productId:product.id,productName:product.name,price:product.price,qty,date,payment,notes,createdAt:new Date().toISOString()});
 save();fillSelects();updatePurchasePreview();renderAll();document.getElementById("buy-qty").value=1;document.getElementById("buy-notes").value="";
 toast("Compra registrada com sucesso!");showView("historico");
});
function paymentBadge(status){const cls=status==="Pago"?"paid":status==="Pendente"?"pending":"cancelled";return `<span class="status ${cls}">${escapeHTML(status)}</span>`;}
function renderDashboard(){
 const list=activePurchases(),gross=list.reduce((s,p)=>s+total(p),0),paid=list.filter(p=>p.payment==="Pago").reduce((s,p)=>s+total(p),0),pending=list.filter(p=>p.payment==="Pendente").reduce((s,p)=>s+total(p),0);
 document.getElementById("stat-total").textContent=money(gross);document.getElementById("stat-paid").textContent=money(paid);document.getElementById("stat-pending").textContent=money(pending);document.getElementById("stat-count").textContent=list.length;document.getElementById("stat-clients").textContent=`${state.clients.length} clientes cadastrados`;
 const values=state.products.map(p=>({name:p.name,value:list.filter(x=>x.productId===p.id).reduce((s,x)=>s+total(x),0)}));const max=Math.max(1,...values.map(x=>x.value));
 document.getElementById("sales-bars").innerHTML=values.map(x=>`<div><div class="bar-label"><span>${escapeHTML(x.name)}</span><strong>${money(x.value)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${x.value/max*100}%"></div></div></div>`).join("");
 document.getElementById("payment-summary").innerHTML=`<div class="summary-box"><div class="summary-row"><span>Recebido</span><strong>${money(paid)}</strong></div><div class="summary-row"><span>Pendente</span><strong>${money(pending)}</strong></div><div class="summary-row"><span>Cancelado (fora do faturamento)</span><strong>${money(state.purchases.filter(p=>p.payment==="Cancelado").reduce((s,p)=>s+total(p),0))}</strong></div><div class="summary-row total"><span>Faturamento válido</span><strong>${money(gross)}</strong></div></div>`;
 const recent=state.purchases.slice(0,6);
 document.getElementById("recent-table").innerHTML=recent.length?recent.map(p=>`<tr><td>#${p.id}</td><td>${escapeHTML(p.date)}</td><td>${escapeHTML(getClient(p.clientId)?.name||"Cliente removido")}</td><td>${escapeHTML(p.productName)} × ${p.qty}</td><td><strong>${money(total(p))}</strong></td><td>${paymentBadge(p.payment)}</td></tr>`).join(""):'<tr><td colspan="6" class="empty">Nenhuma compra registrada ainda. Use “Registrar compra” para começar.</td></tr>';
}
function filteredPurchases(){
 const cid=document.getElementById("filter-client").value,pid=document.getElementById("filter-product").value,pay=document.getElementById("filter-payment").value,from=document.getElementById("filter-from").value,to=document.getElementById("filter-to").value;
 return state.purchases.filter(p=>(!cid||p.clientId===Number(cid))&&(!pid||p.productId===Number(pid))&&(!pay||p.payment===pay)&&(!from||p.date>=from)&&(!to||p.date<=to));
}
function renderHistory(){
 const list=filteredPurchases(),valid=list.filter(p=>p.payment!=="Cancelado"),paid=valid.filter(p=>p.payment==="Pago").reduce((s,p)=>s+total(p),0),pending=valid.filter(p=>p.payment==="Pendente").reduce((s,p)=>s+total(p),0);
 document.getElementById("filter-total").textContent=money(valid.reduce((s,p)=>s+total(p),0));document.getElementById("filter-paid").textContent=money(paid);document.getElementById("filter-pending").textContent=money(pending);document.getElementById("filter-count").textContent=list.length;
 document.getElementById("history-table").innerHTML=list.length?list.map(p=>`<tr><td>#${p.id}</td><td>${escapeHTML(p.date)}</td><td>${escapeHTML(getClient(p.clientId)?.name||"Cliente removido")}</td><td>${escapeHTML(p.productName)}</td><td>${p.qty}</td><td>${money(p.price)}</td><td><strong>${money(total(p))}</strong></td><td>${paymentBadge(p.payment)}</td><td><div class="actions">${p.payment==="Pendente"?`<button class="secondary" onclick="markPaid(${p.id})">Marcar pago</button>`:""}${p.payment!=="Cancelado"?`<button class="danger" onclick="cancelPurchase(${p.id})">Cancelar</button>`:""}<button class="muted-btn" onclick="deletePurchase(${p.id})">Excluir</button></div></td></tr>`).join(""):'<tr><td colspan="9" class="empty">Nenhum registro encontrado para esses filtros.</td></tr>';
 document.getElementById("client-summary").innerHTML=state.clients.map(c=>{const cp=state.purchases.filter(p=>p.clientId===c.id&&p.payment!=="Cancelado"),sum=cp.reduce((s,p)=>s+total(p),0),got=cp.filter(p=>p.payment==="Pago").reduce((s,p)=>s+total(p),0),due=cp.filter(p=>p.payment==="Pendente").reduce((s,p)=>s+total(p),0);return `<tr><td>${escapeHTML(c.name)}</td><td>${cp.length}</td><td>${money(sum)}</td><td>${money(got)}</td><td>${money(due)}</td></tr>`}).join("");
}
function markPaid(id){const p=state.purchases.find(x=>x.id===id);if(!p||p.payment!=="Pendente")return;p.payment="Pago";save();renderAll();renderHistory();toast("Pagamento atualizado para pago.");}
function cancelPurchase(id){const p=state.purchases.find(x=>x.id===id);if(!p||p.payment==="Cancelado")return;if(!confirm(`Cancelar a compra #${id}? O valor sairá do faturamento e as unidades voltarão ao estoque.`))return;const prod=getProduct(p.productId);if(prod)prod.stock+=p.qty;p.payment="Cancelado";save();renderAll();renderHistory();toast("Compra cancelada e estoque atualizado.");}
function deletePurchase(id){const p=state.purchases.find(x=>x.id===id);if(!p)return;if(!confirm(`Excluir permanentemente a compra #${id}? O estoque será devolvido.`))return;const prod=getProduct(p.productId);if(prod)prod.stock+=p.qty;state.purchases=state.purchases.filter(x=>x.id!==id);save();renderAll();renderHistory();toast("Compra excluída e estoque devolvido.");}
["filter-client","filter-product","filter-payment","filter-from","filter-to"].forEach(id=>document.getElementById(id).addEventListener("change",renderHistory));
function clearFilters(){["filter-client","filter-product","filter-payment","filter-from","filter-to"].forEach(id=>document.getElementById(id).value="");renderHistory();}
function exportCSV(){
 const list=filteredPurchases();if(!list.length){toast("Não há registros para exportar.");return;}
 const rows=[["ID","Data","Cliente","Telefone","Produto","Quantidade","Valor unitário","Total","Pagamento","Observações"],...list.map(p=>{const c=getClient(p.clientId);return[p.id,p.date,c?.name||"",c?.phone||"",p.productName,p.qty,p.price.toFixed(2).replace(".",","),total(p).toFixed(2).replace(".",","),p.payment,p.notes||""]})];
 const csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="relatorio-frutafin.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Relatório CSV exportado.");
}
function renderClients(){
 document.getElementById("clients-table").innerHTML=state.clients.map(c=>{const cp=state.purchases.filter(p=>p.clientId===c.id&&p.payment!=="Cancelado");return `<tr><td>${c.id}</td><td><strong>${escapeHTML(c.name)}</strong></td><td>${escapeHTML(c.phone)}</td><td>${cp.length}</td><td>${money(cp.reduce((s,p)=>s+total(p),0))}</td><td>${money(cp.filter(p=>p.payment==="Pendente").reduce((s,p)=>s+total(p),0))}</td><td><button class="secondary" onclick="filterClient(${c.id})">Ver histórico</button></td></tr>`}).join("");
}
function filterClient(id){showView("historico");document.getElementById("filter-client").value=String(id);renderHistory();}
function renderProducts(){
 document.getElementById("product-cards").innerHTML=state.products.map(p=>`<div class="product-card"><strong>${escapeHTML(p.name)}</strong><div class="product-price">${money(p.price)}</div><div class="small">ID ${p.id} · Estoque: <span class="${p.stock<5?"low":""}">${p.stock} un.</span></div><div class="field" style="margin-top:12px"><label for="stock-${p.id}">Ajustar estoque</label><div class="inline"><input id="stock-${p.id}" type="number" min="0" step="1" value="${p.stock}"><button class="secondary" onclick="updateStock(${p.id})">Salvar</button></div></div></div>`).join("");
 document.getElementById("products-table").innerHTML=state.products.map(p=>`<tr><td>${p.id}</td><td>${escapeHTML(p.name)}</td><td>${money(p.price)}</td><td class="${p.stock<5?"low":""}">${p.stock} un.</td><td>${money(p.stock*p.price)}</td></tr>`).join("");
}
function updateStock(id){const p=getProduct(id),input=document.getElementById("stock-"+id),v=Number(input.value);if(!p)return;if(!Number.isInteger(v)||v<0){toast("O estoque deve ser um número inteiro igual ou maior que zero.");input.value=p.stock;return;}p.stock=v;save();renderAll();renderProducts();toast(`Estoque de ${p.name} atualizado.`);}
function renderAll(){renderDashboard();renderHistory();renderClients();renderProducts();updatePurchasePreview();}
fillSelects();renderAll();updatePurchasePreview();
