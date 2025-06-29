//handles book selection, payment, and success page messaging

document.addEventListener('DOMContentLoaded', () => {
  //“Pay” buttons on the book list on index.hmtl
  document.querySelectorAll('.pay-button').forEach(button => {
    button.addEventListener('click', e => {
      // Save which book was clicked and go to checkout
      sessionStorage.setItem('selectedBook', e.currentTarget.dataset.book);
      window.location.href = 'pay.html';
    });
  });

  //Payment form from pay.html
  const form = document.getElementById('payment-form');
  if (form) form.addEventListener('submit', handlePayment);

  //success message which gets sent success.hmtl
  const confirmation = document.getElementById('confirmation-msg');
  if (confirmation) {
    const lastFour = sessionStorage.getItem('last4');
    if (lastFour) {
      confirmation.textContent =
        `Your Mastercard **** **** **** ${lastFour} has been charged successfully.`;
    } else {
      confirmation.textContent = 'Payment processed.';
    }
  }
});

// validate 16-digit Mastercards that start 51-55
function validateCardNumber(number) {
  const cleaned = number.replace(/\s+/g, '');
  return /^(5[1-5][0-9]{14})$/.test(cleaned);
}

// CVV must be 3–4 digits
function validateCvv(cvv) {
  return /^[0-9]{3,4}$/.test(cvv);
}

// expiry must be in the future
function validateExpiry(month, year) {
  const now = new Date();
  const exp = new Date(year, month - 1, 1);
  exp.setMonth(exp.getMonth() + 1); // jumps to start of the following month
  return exp > now;
}

// main handler for the payment form
async function handlePayment(event) {
  event.preventDefault();

  const messageBox  = document.getElementById('payment-message');
  messageBox.textContent = '';

  // read fields
  const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
  const expMonth   = parseInt(document.getElementById('exp-month').value, 10);
  const expYear    = parseInt(document.getElementById('exp-year').value, 10);
  const cvv        = document.getElementById('cvv').value;

  // run validations
  const errors = [];
  if (!validateCardNumber(cardNumber)) errors.push('Invalid Mastercard number.');
  if (!validateExpiry(expMonth, expYear)) errors.push('Card has expired.');
  if (!validateCvv(cvv)) errors.push('Invalid CVV.');

  // show all errors at once
  if (errors.length) {
    messageBox.textContent = errors.join(' ');
    messageBox.style.color = 'red';
    return;
  }

  try {
    // Send data to API
    const response = await fetch('https://mudfoot.doc.stu.mmu.ac.uk/node/api/creditcard', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        master_card: Number(cardNumber),
        exp_year   : expYear,
        exp_month  : expMonth,
        cvv_code   : cvv
      })
    });

    // Throw if API returns error status
    if (!response.ok) {
      const serverMsg = await response.text();
      throw new Error(serverMsg || 'Payment failed.');
    }

    // Success: remembers last four digits 
    sessionStorage.setItem('last4', cardNumber.slice(-4));
    window.location.href = 'success.html';
  } catch (err) {
    // error – sends error message
    messageBox.textContent = err.message;
    messageBox.style.color = 'red';
  }
}
