const Joi = require('@hapi/joi')
const ladda = require('ladda')

require('ladda/dist/ladda.min.css')

const API_URL = window.location.hostname === 'buildnumber.dev' ? 'https://api.buildnumber.dev' : 'http://localhost:3000/api'

const windowUrl = new URL(window.location.href)
const token = windowUrl.searchParams.get('token') || 'API_TOKEN'
document.querySelectorAll('.api-key').forEach(e => {
    e.innerText = token
})

const emailField = document.querySelector('#email-field')
const bundleIdentifierField = document.querySelector('#bundle-identifier-field')
const signupButton = document.querySelector('#signup-button')
const signupButtonLadda = ladda.create(signupButton)
const form = document.querySelector('#signup-form')
const resultContainer = document.querySelector('#signup-result')
const errorContainer = document.querySelector('#signup-result .result-error')
const successContainer = document.querySelector('#signup-result .result-success')

function showError(html) {
    resultContainer.classList.remove('closed')
    errorContainer.innerHTML = html
    errorContainer.classList.remove('hidden')
    successContainer.classList.add('hidden')
}

function showSuccess(html) {
    resultContainer.classList.remove('closed')
    errorContainer.classList.add('hidden')
    successContainer.innerHTML = html
    successContainer.classList.remove('hidden')
}

function hideResult() {
    resultContainer.classList.add('closed')
}

form.addEventListener('submit', async ev => {
    ev.preventDefault()
    
    const emailAddress = emailField.value
    const bundleIdentifier = bundleIdentifierField.value
    
    try {
        Joi.assert(emailAddress, Joi.string().email().required())
    } catch (err) {
        showError('Please enter a valid email address')
        return
    }

    emailField.disabled = true
    bundleIdentifierField.disabled = true
    signupButtonLadda.start()
    hideResult()
    
    fetch(`${API_URL}/tokens`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress, bundleIdentifier })
    })
    .then(async res => {
        if (!res.ok) {
            let message = null
            try {
                const json = await res.json()
                message = json.message
                console.log(message)
            } catch (err) {
                // no-op
            }
            throw new Error(message || 'Something went wrong, please try again!')
        }
        return res
    })
    .then(res => {
        const msg = `Your API token has been sent to ${emailAddress}<br>Check your emails!`
        showSuccess(msg)
    })
    .catch(err => {
        showError(err.message)
    })
    .finally(() => {
        emailField.disabled = false
        bundleIdentifierField.disabled = false
        signupButtonLadda.stop()
    })
})
