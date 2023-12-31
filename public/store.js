if(document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else{
    ready()
}

function ready(){
    var removeBtn = document.getElementsByClassName("btn btn-danger");
    for(var i = 0; i < removeBtn.length; i++){
        var button = removeBtn[i];
        button.addEventListener('click', removeCartItem)
    }

    var quantityItems = document.getElementsByClassName("cart-quantity-input");
    for(var i = 0; i < quantityItems.length; i++){
        var quantity = quantityItems[i];
        quantity.addEventListener('change', quantityChange)
    }

    var addBtn = document.getElementsByClassName("btn btn-primary shop-item-button");
    for(var i = 0; i < addBtn.length; i++){
        var button = addBtn[i];
        button.addEventListener('click', addCartItem)
    }

    document.getElementsByClassName("btn-purchase")[0].addEventListener('click',purchaseBtnClicked);

}

function removeCartItem(event){
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove()
    // console.log("Remove")
    updateCartTotal()  
}

function updateCartTotal(){
    var cartItemContainter = document.getElementsByClassName("cart-items")[0];
    var row = cartItemContainter.getElementsByClassName("cart-row");
    var total = 0;
    for(var i = 0; i < row.length; i++){
        var price = row[i].getElementsByClassName("cart-price cart-column")[0].innerText.replace('$', '');
        var quantity = row[i].getElementsByClassName("cart-quantity-input")[0].value;
        total = total + price * quantity;
    }
    //console.log(total);
    total = Math.round(total*100) / 100
    document.getElementsByClassName("cart-total-price")[0].innerText = "$" + total;
}


function quantityChange(event){
    //cannot set quantity to event.target.value (it's a data copy 
    //not a reference=>won't change the actual value of the html)
    var quantity = event.target
    //console.log(quantity.value)
    if(isNaN(quantity.value) || quantity.value < 1){
        quantity.value = 1
    }
    //console.log(quantity.value)
    updateCartTotal()
}

function addCartItem(event){
    var item = event.target.parentElement.parentElement;
    var title = item.getElementsByClassName("shop-item-title")[0].innerText;
    var price = item.getElementsByClassName("shop-item-price")[0].innerText;
    var img = item.getElementsByClassName("shop-item-image")[0].src;
    var id = item.dataset.itemId //access "data-item-id" html attribute
    //console.log(id)

    //Check for repeated item
    var cartItemTitles = document.getElementsByClassName("cart-item-title");
    for(var i = 0; i < cartItemTitles.length; i++){
        var existTitle = cartItemTitles[i].innerText;
        if(existTitle == title){
            alert("This item has already been added to the cart!")
            return
        }
    }

    //Create a new cart row
    var cartRow = document.createElement('div');
    cartRow.classList.add('cart-row');
    cartRow.dataset.itemId = id
    var cartRowContent = `
    <div class="cart-item cart-column">
        <img class="cart-item-image" src="${img}" width="100" height="100">
        <span class="cart-item-title">${title}</span>
    </div>
    <span class="cart-price cart-column">${price}</span>
    <div class="cart-quantity cart-column">
        <input class="cart-quantity-input" type="number" value="1">
        <button class="btn btn-danger" type="button">REMOVE</button>
    </div>`
    cartRow.innerHTML = cartRowContent
    var cartItem = document.getElementsByClassName("cart-items")[0];
    cartItem.append(cartRow);
    updateCartTotal()
    cartRow.getElementsByClassName('btn btn-danger')[0].addEventListener('click', removeCartItem);
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChange);

}

var stripeHandler = StripeCheckout.configure({
    //need to match with ejs variable name inside script
    key: stripePublicKey,
    //language setting
    locale: 'auto',
    //when finished transaction, the response stripe gave us is in the token
    token: function(token){
        var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')
        for(var i = 0; i < cartRows.length; i++){
            var cartRow = cartRows[i];
            var quantityContainer = cartRow.getElementsByClassName('cart-quantity-input')[0]
            var quantity = quantityContainer.value;
            var id = cartRow.dataset.itemId
            items.push({
                id: id,
                quantity: quantity
            })
        }
        //console.log(items)

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'Accept' : 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function(res){
            return res.json()
        }).then(function(data){
            alert(data.message)
            //remove items in the cart
            var cartItem = document.getElementsByClassName('cart-items')[0];
            while(cartItem.hasChildNodes()){
                cartItem.removeChild(cartItem.firstChild);
            }
            updateCartTotal();
        }).catch(function(error){
            console.error(error)
        })
    }

})

function purchaseBtnClicked(){
    // alert("Thank you for your purchase.");
    // var cartItem = document.getElementsByClassName('cart-items')[0];
    // while(cartItem.hasChildNodes()){
    //     cartItem.removeChild(cartItem.firstChild);
    // }
    // updateCartTotal();

    //console.log('Enter purchaseBtn')
    var totalPriceElement = document.getElementsByClassName("cart-total-price")[0];
    var totalPrice = parseFloat(totalPriceElement.innerText.replace('$', '')) * 100;
    //console.log(totalPrice);
    stripeHandler.open({
        amount: totalPrice
    });
}


