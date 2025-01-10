document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
    const signupForm = document.getElementById("signupForm") as HTMLFormElement | null;

    const displayErrors = (fieldId: string, message: string): void => {
        const errorElement = document.getElementById(`${fieldId}Error`) as HTMLSpanElement | null;
        const inputElement = document.getElementById(fieldId) as HTMLInputElement | null;

        if (errorElement) {
            errorElement.textContent = message;
        }

        if (inputElement) {
            inputElement.classList.add('error-border');
        }
    };

    const clearErrors = (): void => {
        document.querySelectorAll('.error-message').forEach((error) => {
            (error as HTMLSpanElement).textContent = '';
        });

        document.querySelectorAll('.error-border').forEach((input) => {
            (input as HTMLInputElement).classList.remove('error-border');
        });
    };

    const isValidEmail = (email: string): boolean => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };

    const validateLoginForm = (): boolean => {
        const loginEmail = (document.getElementById('loginEmail') as HTMLInputElement).value.trim();
        const loginPassword = (document.getElementById('loginPassword') as HTMLInputElement).value.trim();

        let isValid = true;

        clearErrors();

        if (!loginEmail) {
            displayErrors("loginEmail", "Email is required.");
            isValid = false;
        } else if (!isValidEmail(loginEmail)) {
            displayErrors("loginEmail", "Enter a valid email.");
            isValid = false;
        }

        if (!loginPassword) {
            displayErrors("loginPassword", "Password is required.");
            isValid = false;
        } else if (loginPassword.length < 8) {
            displayErrors("loginPassword", "Password must be atleast 8 characters.");
            isValid = false;
        }

        return isValid;
    }

    const validateSignupForm = (): boolean => {
        const firstName = (document.getElementById("firstName") as HTMLInputElement).value.trim();
        const lastName = (document.getElementById("lastName") as HTMLInputElement).value.trim();
        const email = (document.getElementById("email") as HTMLInputElement).value.trim();
        const password = (document.getElementById("password") as HTMLInputElement).value;
        const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value;

        let isValid = true;

        clearErrors();

        if (firstName === '') {
            displayErrors("firstName", "First name is required.");
            isValid = false;
        } else if (firstName.length < 3 || firstName.length > 15) {
            displayErrors("firstName", "First name must be between 3 and 15 characters long.");
            isValid = false;
        } else if (!/^[a-zA-Z]+$/.test(firstName)) {
            displayErrors("firstName", "Please enter a valid first name. Only letters are allowed.");
            isValid = false;
        }

        if (lastName === '') {
            displayErrors("lastName", "Last name is required.");
            isValid = false;
        } else if (lastName.length < 3 || lastName.length > 15) {
            displayErrors("lastName", "Last name must be between 3 and 15 characters long.");
            isValid = false;
        } else if (!/^[a-zA-Z]+$/.test(lastName)) {
            displayErrors("lastName", "Please enter a valid last name. Only letters are allowed.");
            isValid = false;
        }

        if (email === '') {
            displayErrors("email", "Email is required.");
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            displayErrors("email", "Please enter a valid email address.");
            isValid = false;
        }

        if (password === '') {
            displayErrors("password", "Password is required.");
            isValid = false;
        } else if (password.length < 8) {
            displayErrors("password", "Password must be at least 8 characters long.");
            isValid = false;
        }

        if (confirmPassword === '') {
            displayErrors("confirmPassword", "Please confirm your password.");
            isValid = false;
        } else if (confirmPassword.length < 8) {
            displayErrors("confirmPassword", "Password must be at least 8 characters long.");
            isValid = false;
        } else if (password !== confirmPassword) {
            displayErrors("confirmPassword", "Passwords do not match.");
            isValid = false;
        }

        return isValid;
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (event: SubmitEvent) => {
            event.preventDefault();

            const isValidateLoginForm: boolean = validateLoginForm();
            if (isValidateLoginForm) {
                loginForm.submit();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", (event: SubmitEvent) => {
            event.preventDefault();

            const isValidateSignupForm: boolean = validateSignupForm();
            if (isValidateSignupForm) {
                signupForm.submit();
            }
        });
    }
});