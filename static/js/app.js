const _ = require('lodash')
const $ = require('jquery')
const Joi = require('@hapi/joi')

const API_URL = window.location.hostname === 'buildnumber.dev' ? 'https://api.buildnumber.dev' : 'http://localhost:3000/api'

$().ready(function() {

    const token = $.url().param('token') || 'API_TOKEN'
    $('.api-key').text(token)

    const $emailField = $('#email-field')
    const $bundleIdentifierField = $('#bundle-identifier-field')
    const $signupButton = $('#signup-button')
    const $form = $('#signup-form')
    const $errorContainer = $('#signup-result .result-error')
    const $successContainer = $('#signup-result .result-success')

    $signupButton.ladda()

    $form.submit(function(ev) {
        ev.preventDefault()
        const emailAddress = $emailField.val()
        const bundleIdentifier = $bundleIdentifierField.val()
        
        try {
            Joi.assert(emailAddress, Joi.string().email().required())
        } catch (err) {
            $errorContainer.text('Please enter a valid email address')
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
            const msg = `Your API token has been sent to ${emailAddress}<br>Check your emails!`
            $successContainer.html(msg)
            $successContainer.slideDown(300)
        }).error(function(err) {
            const errorText = _.get(err, 'responseJSON.error', 'Something went wrong, please try again!')
            $errorContainer.text(errorText)
            $errorContainer.slideDown(300)
        }).always(function() {
            $emailField.prop('disabled', false)
            $bundleIdentifierField.prop('disabled', false)
            $signupButton.ladda('stop')
        })
    })
})
