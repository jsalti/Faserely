document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('termsCheckbox');
    var nextButton = document.getElementById('nextButton');

    function updateButtonStyle() {
        if (checkbox.checked) {
            nextButton.className = 'button-checked';
        } else {
            nextButton.className = 'button-unchecked';
        }
    }

    checkbox.addEventListener('change', updateButtonStyle);

    updateButtonStyle();
});


document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById('termsCheckbox');
    var nextButton = document.getElementById('nextButton');

    nextButton.addEventListener('click', function() {
        if (checkbox.checked) {
            window.location.href = 'translate.html';
        } else {
            Swal.fire({
                title: 'الشروط والأحكام',
                text: 'يرجى الموافقة على الشروط والأحكام للمتابعة',
                icon: 'warning',
                confirmButtonText: 'حسناً',
                customClass: {
                    confirmButton: 'custom-ok-button'
                }
            });
        }
    });
});


