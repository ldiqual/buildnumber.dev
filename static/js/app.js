'use strict'

var API_URL = window.location.hostname === 'buildnumber.io' ? 'https://api.buildnumber.io' : 'http://localhost:3000/api'

$().ready( function(){

    var token = $.url().param('token') || 'API_TOKEN'
    $('.api-key').text(token)

    var $emailField = $('#email-field')
    var $bundleIdentifierField = $('#bundle-identifier-field')
    var $signupButton = $('#signup-button')
    var $form = $('#signup-form')
    var $errorContainer = $('#signup-result .result-error')
    var $successContainer = $('#signup-result .result-success')

    $signupButton.ladda()

    $form.submit(function(ev) {
        ev.preventDefault()
        var emailAddress = $emailField.val()
        var bundleIdentifier = $bundleIdentifierField.val()

        var regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        if (!regex.test(emailAddress)) {
            $errorContainer.text("Please enter a valid email address")
            $errorContainer.slideDown(300)
            return
        }

        $emailField.prop('disabled', true)
        $signupButton.ladda('start')
        $errorContainer.slideUp(300)
        $successContainer.slideUp(300)

        $.post({
            url: API_URL + '/tokens',
            contentType: 'application/json',
            data: JSON.stringify({ emailAddress, bundleIdentifier })
        }).success(function(data) {
            var msg = "Your API token has been sent to " + emailAddress + ".<br>" +
                "Check your emails!"
            $successContainer.html(msg)
            $successContainer.slideDown(300)
        }).error(function(err) {
            var errorText = _.get(err, 'responseJSON.error', 'Something went wrong, please try again!')
            $errorContainer.text(errorText)
            $errorContainer.slideDown(300)
        }).always(function() {
            $emailField.prop('disabled', false)
            $bundleIdentifierField.prop('disabled', false)
            $signupButton.ladda('stop')
        })
    })
});
