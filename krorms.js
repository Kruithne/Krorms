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
		months: [
			'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
		],
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

			// Automatically run updateRange on any select elements already around.
			$('select').each(function()
			{
				krorms.updateRange($(this));
			})
		},

		updateSelectorDays: function(selector)
		{
			// Make sure our selector is jQuery
			if (!selector instanceof jQuery)
				selector = $(selector);

			var holder = selector.parent(),
				monthSelector = holder.children('[type=month]').first(),
				yearSelector = holder.children('[type=year]').first(),
				days = new Date(yearSelector.val(), monthSelector.val(), 0).getDate(),
				currentIndex = 1;

			selector.empty(); // Remove all existing values.
			while (currentIndex < days + 1)
			{
				$('<option/>').val(currentIndex).html(currentIndex).appendTo(selector);
				currentIndex++;
			}
		},

		parseRangeValue: function(valueString)
		{
			return valueString == 'year' ? new Date().getFullYear() : parseInt(valueString);
		},

		updateRange: function(element)
		{
			// Make sure our object is jQuery.
			if (!element instanceof jQuery)
				element = $(element);

			var range = element.attr('range');

			if (range != undefined)
			{
				// Populate the selector with all the months.
				if (range == 'months')
				{
					for (var monthIndex in krorms.months)
						$('<option/>').val(monthIndex + 1).html(krorms.months[monthIndex]).appendTo(element);
					return;
				}

				// Populate the selector with days and keep them updated correctly.
				if (range == 'days')
				{
					var holder = element.parent(),
						updateFunction = function()
						{
							krorms.updateSelectorDays(element);
						};

					holder.children('[type=month]').first().on('change', updateFunction);
					holder.children('[type=year]').first().on('change', updateFunction);
					setTimeout(updateFunction, 1); // Delay by 1ms so the further elements are loaded.
				}

				var rangeSplit = range.split('-', 2),
					lower = krorms.parseRangeValue(rangeSplit[0]),
					higher = krorms.parseRangeValue(rangeSplit[1]);

				var i = lower;
				if (lower > higher)
				{
					while (i > higher - 1)
					{
						$('<option/>').val(i).html(i).appendTo(element);
						i--;
					}
				}
				else
				{
					while (i < higher + 1)
					{
						$('<option/>').val(i).html(i).appendTo(element);
						i++;
					}
				}
			}
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