$(function()
{
	var krorms =
	{
		errorMessages: {
			min_length: '{field} must be at least {min} characters.',
			max_length: '{field} cannot exceed {max} characters.',
			both_length: '{field} must be between {min}-{max} characters.',
			invalid_email: '{field} must contain a valid e-mail address.',
			invalid_number: '{field} must contain a valid number.'
		},
		errors: [],
		isFunction: function(functionName)
		{
			return typeof functionName === 'function';
		},

		load: function()
		{
			$(document).on('submit', '.validatable', function(event)
			{
				var form = $(this);

				var submitFunction = window[form.attr('submit')];
				if (submitFunction != undefined && krorms.isFunction(submitFunction))
					submitFunction(form);

				if (krorms.validate(form))
				{
					// Check if we have a completion function and provoke it.
					var completeFunction = window[form.attr('complete')];
					if (completeFunction != undefined && krorms.isFunction(completeFunction))
						completeFunction(form);

					// Prevent the default form behavior if specified.
					if (form.hasClass('preventDefault'))
						event.preventDefault();
				}
				else
				{
					event.preventDefault();
					var errorFunction = window[form.attr('error')];
					if (errorFunction != undefined && krorms.isFunction(errorFunction))
						errorFunction(krorms.errors);
				}
			});

			$('.validatable').each(function()
			{
				var form = $(this);
				form.find('select').each(function()
				{
					var field = $(this),
						range = field.attr('range');

					if (range != undefined)
					{
						var rangeSplit = range.split('-', 2),
							lower = parseInt(rangeSplit[0]),
							higher = parseInt(rangeSplit[1]);

						if (lower > higher)
						{
							var tempLower = lower;
							lower = higher;
							higher = tempLower;
						}

						var i = lower;
						while (i < higher + 1)
						{
							$('<option value="' + i + '">' + i + '</option>').appendTo(field);
							i++;
						}
					}
				});
			})
		},

		validate: function(form)
		{
			krorms.errors = [];

			// Loop through each field and validate it.
			form.find('input,textarea').each(function()
			{
				var field = $(this);
				krorms.validateField(field);
			});

			return krorms.errors.length == 0;
		},

		validateField: function(field, errors)
		{
			var minLength = field.attr('minlength'),
				maxLength = field.attr('maxlength'),
				fieldValue = field.val(),
				fieldName = field.attr('name'),
				valueLength = fieldValue.length;

			if (minLength != undefined && maxLength != undefined && (valueLength < minLength || valueLength > maxLength))
			{
				krorms.error(field, 'both_length', { field: fieldName, min: minLength, max: maxLength} );
			}
			else
			{
				if (minLength != undefined && valueLength < minLength)
					krorms.error(field, 'min_length', { field: fieldName, min: minLength} );

				if (maxLength != undefined && valueLength > maxLength)
					krorms.error(field, 'max_length', { field: fieldName, max: maxLength} );
			}

			var validateType = field.attr('validate');
			if (validateType != undefined)
			{
				if (validateType == 'email')
				{
					if (fieldValue.match(/^\S+@\S+\.[a-zA-Z]+$/) == null)
						krorms.error(field, 'invalid_email', {field: fieldName});
				}
				else if (validateType == 'number')
				{
					if (fieldValue.match(/^[\d]+$/) == null)
						krorms.error(field, 'invalid_number', {field: fieldName});
				}
			}
		},

		error: function(field, error, values)
		{
			krorms.errors.push([field, krorms.errorMessage(error, values)]);
		},

		errorMessage: function(id, replaces)
		{
			var string = krorms.errorMessages[id];
			for (var replaceIndex in replaces)
				string = string.replace(new RegExp('{' + replaceIndex + '}', 'g'), replaces[replaceIndex]);

			return string;
		},

		// Set a custom error message in-place of the defaults.
		setErrorMessage: function(id, message)
		{
			krorms.errorMessages[id] = message;
		}
	};
	krorms.load();
});