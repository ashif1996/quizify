document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('loader') as HTMLElement | null;

    const showLoader = (): void => {
        if (spinner) {
            spinner.style.display = 'flex';  // Show the loader
            spinner.setAttribute('aria-busy', 'true');
        }
    };

    const hideLoader = (): void => {
        if (spinner) {
            spinner.style.display = 'none';  // Hide the loader
            spinner.removeAttribute('aria-busy');
        }
    };

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

    const isValidName = (name: string): boolean => {
        const regex = /^[A-Za-z\s]+$/;
        return regex.test(name);
    };

    const isValidEmail = (email: string): boolean => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };

    const validateContactForm = (): boolean => {
        const messageName = document.getElementById('messageName') as HTMLInputElement | null;
        const messageEmail = document.getElementById('messageEmail') as HTMLInputElement | null;
        const messageContent = document.getElementById('messageContent') as HTMLTextAreaElement | null;

        let isValid = true;

        clearErrors();

        if (!messageName || !messageName.value.trim()) {
            displayErrors('messageName', 'Name is required.');
            isValid = false;
        } else if (!isValidName(messageName.value.trim())) {
            displayErrors('messageName', 'Name should not contain numbers.');
            isValid = false;
        }

        if (!messageEmail || !messageEmail.value.trim()) {
            displayErrors('messageEmail', 'Email is required.');
            isValid = false;
        } else if (!isValidEmail(messageEmail.value.trim())) {
            displayErrors('messageEmail', 'Please enter a valid email address.');
            isValid = false;
        }

        if (!messageContent || !messageContent.value.trim()) {
            displayErrors('messageContent', 'Message is required.');
            isValid = false;
        }

        return isValid;
    };

    const handleFormSubmit = async (form: HTMLFormElement, endpoint: string, method: string): Promise<void> => {
        const formData = new FormData(form);
        const jsonData = JSON.stringify(Object.fromEntries(formData.entries()));

        showLoader();

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonData,
            });

            const data = await response.json();
            hideLoader();

            if (data.success) {
                window.location.reload();
            } else {
                window.location.reload();
            }
        } catch (error) {
            hideLoader();
            
            window.location.reload();
        }
    };

    const contactForm = document.getElementById('contactForm') as HTMLFormElement | null;
    if (contactForm) {
        contactForm.addEventListener('submit', (event: SubmitEvent) => {
            event.preventDefault();

            const isValidContactForm: boolean = validateContactForm();
            if (isValidContactForm) {
                handleFormSubmit(contactForm, '/users/contact/send-email', 'POST');
            }
        });
    }
});