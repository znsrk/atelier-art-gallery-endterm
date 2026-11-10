/* Forms are demonstrations: values stay in this page and passwords are never saved. */
$(function () {
    "use strict";

    // This regular expression requires one @, a domain, and a domain extension.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Use text(), not html(), so a visitor's input cannot become HTML code.
    function showFeedback(fieldId, errorMessage) {
        const $field = $("#" + fieldId);
        const $feedback = $("#" + fieldId + "-feedback");
        const isValid = errorMessage === "";

        $field.toggleClass("is-invalid", !isValid);
        $field.toggleClass("is-valid", isValid);
        $field.attr("aria-invalid", String(!isValid));
        $feedback.toggleClass("error-text", !isValid);
        $feedback.toggleClass("success-text", isValid);
        $feedback.text(isValid ? "Looks good." : errorMessage);
        return isValid;
    }

    function clearFeedback($form) {
        $form.find(".form-control").removeClass("is-valid is-invalid").removeAttr("aria-invalid");
        $form.find(".field-feedback").text("").removeClass("error-text success-text");
        $form.find(".form-alert").prop("hidden", true);
    }

    // Registration uses these simple rules to label the three strength levels.
    function passwordStrength(password) {
        if (password.length === 0) {
            return 0;
        }
        const hasRequiredCharacters = /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
        if (password.length < 8 || !hasRequiredCharacters) {
            return 1;
        }
        if (password.length >= 12 && /[^A-Za-z0-9\s]/.test(password)) {
            return 3;
        }
        return 2;
    }

    function updateStrength(password) {
        const level = passwordStrength(password);
        const labels = ["Not entered", "Weak", "Medium", "Strong"];
        $("#password-strength")
            .attr("data-strength", level)
            .attr("aria-valuenow", level)
            .attr("aria-valuetext", labels[level]);
        $("#password-strength-label").text("Password strength: " + labels[level]);
    }

    const $registration = $("#registration-form");
    if ($registration.length) {
        const registrationFields = ["register-name", "register-email", "register-password", "register-confirm"];

        function validateRegistrationField(fieldId) {
            const value = $("#" + fieldId).val();
            let error = "";

            if (fieldId === "register-name" && value.trim() === "") {
                error = "Enter your name; spaces alone do not count.";
            }
            if (fieldId === "register-email") {
                if (value.trim() === "") {
                    error = "Enter your email address.";
                } else if (!emailPattern.test(value.trim())) {
                    error = "Use an email address such as alex@example.com.";
                }
            }
            if (fieldId === "register-password") {
                updateStrength(value);
                if (value === "") {
                    error = "Enter a password.";
                } else if (passwordStrength(value) < 2) {
                    error = "Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.";
                }
            }
            if (fieldId === "register-confirm") {
                if (value === "") {
                    error = "Enter your password again.";
                } else if (value !== $("#register-password").val()) {
                    error = "The passwords do not match.";
                }
            }
            return showFeedback(fieldId, error);
        }

        // Real-time input and blur events provide immediate field feedback.
        $registration.find("input").on("input blur", function () {
            $("#registration-success, #registration-errors").prop("hidden", true);
            validateRegistrationField(this.id);
            if (this.id === "register-password" && $("#register-confirm").val() !== "") {
                validateRegistrationField("register-confirm");
            }
        });

        $("#toggle-passwords").on("click", function () {
            const showPasswords = $(this).attr("aria-pressed") !== "true";
            $("#register-password, #register-confirm").attr("type", showPasswords ? "text" : "password");
            $(this).attr("aria-pressed", String(showPasswords));
            $(this).text(showPasswords ? "Hide passwords" : "Show passwords");
        });

        $registration.on("reset", function () {
            clearFeedback($registration);
            updateStrength("");
            $("#register-password, #register-confirm").attr("type", "password");
            $("#toggle-passwords").attr("aria-pressed", "false").text("Show passwords");
        });

        $registration.on("submit", function (event) {
            event.preventDefault();
            let firstInvalidField = null;

            // Check every field so all errors are shown in one submission attempt.
            registrationFields.forEach(function (fieldId) {
                if (!validateRegistrationField(fieldId) && firstInvalidField === null) {
                    firstInvalidField = fieldId;
                }
            });

            $("#registration-success").prop("hidden", true);
            if (firstInvalidField !== null) {
                $("#registration-errors").prop("hidden", false);
                $("#" + firstInvalidField).trigger("focus");
                return;
            }

            // Clear all demo details, including both passwords, before displaying success.
            this.reset();
            $("#registration-success").prop("hidden", false).trigger("focus");
        });

        // A disabled button prevents a form demonstration without JavaScript.
        $("#registration-submit, #toggle-passwords").prop("disabled", false);
    }

    const $contact = $("#contact-form");
    if ($contact.length) {
        const contactFields = ["visitor-name", "visitor-email", "message"];

        function validateContactField(fieldId) {
            const value = $("#" + fieldId).val().trim();
            let error = "";
            if (value === "") {
                const labels = { "visitor-name": "name", "visitor-email": "email address", "message": "message" };
                error = "Enter your " + labels[fieldId] + "; spaces alone do not count.";
            } else if (fieldId === "visitor-email" && !emailPattern.test(value)) {
                error = "Use an email address such as alex@example.com.";
            }
            return showFeedback(fieldId, error);
        }

        $contact.find("input, textarea").on("input blur", function () {
            $("#contact-errors").prop("hidden", true);
            validateContactField(this.id);
        });

        $contact.on("submit", function (event) {
            event.preventDefault();
            let firstInvalidField = null;
            contactFields.forEach(function (fieldId) {
                if (!validateContactField(fieldId) && firstInvalidField === null) {
                    firstInvalidField = fieldId;
                }
            });
            if (firstInvalidField !== null) {
                $("#contact-errors").prop("hidden", false);
                $("#" + firstInvalidField).trigger("focus");
                return;
            }

            // The destination contains no form values, and no message is sent or stored.
            window.location.assign("thank-you.html");
        });

        $contact.on("reset", function () {
            clearFeedback($contact);
        });

        $("#contact-submit").prop("disabled", false);
    }
});
