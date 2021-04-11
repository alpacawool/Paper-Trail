var balance = 10000;
var holdingsBalance = 0;

document.addEventListener('DOMContentLoaded', function() {
  performSetup();
})


function performSetup(){

    setBalances();

}

function setBalances(){

    var balDiv = document.getElementById("balances");
    balDiv.innerHTML = "<h3>Current balance: " +  Math.round(balance) + "</h3> <br> <h3>Holdings Balance: " + Math.round(holdingsBalance);

}

function decrementBalance(amount){

    balance -= amount;
    holdingsBalance += amount;
    setBalances();
}
