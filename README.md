# Krorms

Krorms is a simple JavaScript (jQuery) library that assists in menial form generating and validating operations.

It's made primarily for my own personal use on projects but feel free to use it in your own projects should you wish to! It's nothing majorly advanced and at present I've not documented it, but all functionality is demonstrated in the test.html file!

### Error Types
+ **min_length**: Value of the field was less than the required minimum length.
+ **max_length**: Value of the field exceeded the maximum length.
+ **both_length**: Returned when both _minlength_ and _maxlength_ are set and one was not met.
+ **invalid_email**: Value of the field was not a valid e-mail address.
+ **invalid_number**: Value of the field was not a valid number.
+ **invalid**: Value of the field did not match the provided regular expression.
+ **required**: The field was required but nothing was entered.
+ **invalid_option_selected**: A selector option was chosen that was marked as noselect.