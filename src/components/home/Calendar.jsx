import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Calendar({ selectedDate, onSelectDate, onSelectTime }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedHour, setSelectedHour] = useState(null)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return { value: hour, label: `${displayHour}:00 ${period}` }
  })

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (date < today) return // Prevent selecting past dates
    
    onSelectDate(date)
    setShowTimePicker(true)
    setSelectedHour(null)
  }

  const handleTimeSelect = (hour) => {
    setSelectedHour(hour)
    onSelectTime(hour)
    setShowTimePicker(false) // Close the time picker after selection
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    setShowTimePicker(false)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    setShowTimePicker(false)
  }

  const isDateSelected = (day) => {
    if (!selectedDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toDateString() === selectedDate.toDateString()
  }

  const isDatePast = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date < today
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-3 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Calendar days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isPast = isDatePast(day)
          const isSelected = isDateSelected(day)
          const showTime = isSelected && showTimePicker

          return (
            <div key={day} className="relative">
              <button
                onClick={() => !isPast && handleDateClick(day)}
                disabled={isPast}
                className={`
                  w-full h-14 rounded-xl font-semibold text-base transition-all
                  ${isPast 
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-primary/10 hover:scale-105 cursor-pointer'
                  }
                  ${isSelected 
                    ? 'bg-primary text-white hover:bg-primary shadow-lg' 
                    : 'bg-white border-2 border-gray-200'
                  }
                  ${showTime ? 'rounded-b-none border-b-0' : ''}
                `}
              >
                {day}
              </button>

              {/* Time Picker Dropdown */}
              {showTime && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-t-0 border-primary rounded-b-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
                  {hours.map(hour => (
                    <button
                      key={hour.value}
                      onClick={() => handleTimeSelect(hour.value)}
                      className={`
                        w-full px-3 py-2.5 text-sm font-medium text-left hover:bg-primary/10 transition
                        ${selectedHour === hour.value ? 'bg-primary text-white hover:bg-primary' : 'text-gray-700'}
                        first:rounded-t-none last:rounded-b-xl
                      `}
                    >
                      {hour.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Date & Time Display */}
      {selectedDate && selectedHour !== null && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
          <p className="text-sm text-gray-600">Selected Date & Time</p>
          <p className="text-lg font-semibold text-primary">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-md font-medium text-primary">
            {hours[selectedHour].label}
          </p>
        </div>
      )}
    </div>
  )
}
