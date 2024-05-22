#include <Arduino.h>                       //enable I2C.
#include <Wire.h>                       //enable I2C.


#define i2c_id 0x68                     //default I2C address   
#define one_byte_read 0x01              //used in a function to read data from the device  
#define two_byte_read 0x02              //used in a function to read data from the device
#define four_byte_read 0x04             //used in a function to read data from the device

const byte interruptPin = 2;            //the interrupt pin used to trigger continuous readings  

byte bus_address = i2c_id;              //holds the I2C address. 
byte bytes_received_from_computer = 0;  //we need to know how many character bytes have been received.
byte serial_event = 0;                  //a flag to signal when data has been received from the serial monitor

char computerdata[20];                  //we make an 20 byte character array to hold incoming data from the serial monitor
char *cmd;                              //char pointer used in string parsing
char *data_byte_1;                      //char pointer used in string parsing
char *data_byte_2;                      //char pointer used in string parsing

union sensor_mem_handler                //declare the use of a union data type
{
	byte i2c_data[4];                   //define a 4 byte array in the union
	long answ;							//define an long in the union
};
union sensor_mem_handler move_data;     //declare that we will refer to the union as �move_data�
volatile byte new_reading = 0;          //a flag to signal when the interrupt pin sees a new reading 
volatile byte continuous_mode = 0;      //use to enable / disable continuous readings 
//*************************************************************************************************************************
//*************************************************************************************************************************
void setup()																			//hardware setup
{
	Serial.begin(9600);																	//enable serial port at 9600 baud
	Wire.begin();																		//enable I2C port

	pinMode(interruptPin, INPUT);                                                       //set the pin used for the interrupt as an input pin 
	attachInterrupt(digitalPinToInterrupt(interruptPin), new_reading_event, CHANGE);	//enable the interrupt to signal an interrupt on change  
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void serialEvent() {																	//this interrupt will trigger when the data coming from the serial monitor is received
	bytes_received_from_computer = Serial.readBytesUntil(13, computerdata, 20);			//we read the data sent from the serial monitor until we see a <CR>. We also count how many characters have been received
	computerdata[bytes_received_from_computer] = 0;										//this stops the buffer from transmitting leftovers or garbage.
	serial_event = 1;																	//this is used as a flag to indicate that we have received a string
}

void new_reading_event() {																//define the function to go to when a new reading interrupt happens  
	if (continuous_mode) { new_reading = 1; }											//set a flag to show that a new reading is available
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void loop() {												//main loop

	if (serial_event) {                                     //if the serial_event flag is set we examine what data was sent
		serial_event = 0;                                   //reset the flag
		parse_data();                                       //calling this function will break up the ASCII string command sent to the arduino from serial monitor
		read_command();                                     //calling this function will interpret the command sent 
	}
	if (new_reading) {                                      //if the new reading event flag is set 
		new_reading = 0;                                    //reset the flag
		reading();                                          //take a reading
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void parse_data() {											//once a string is received from the serial monitor it is parsed at each comma
	byte i;                                                 //counter

	for (i = 0; i < bytes_received_from_computer; i++) {    //for each char byte received 
		computerdata[i] = tolower(computerdata[i]);			//set the char to lower case 
	}

	cmd = strtok(computerdata, ",");                        //let's parse the string at each comma
	data_byte_1 = strtok(NULL, ",");                        //let's parse the string at each comma
	data_byte_2 = strtok(NULL, ",");                        //let's parse the string at each comma
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void read_command() {										//we evaluate the string stored in the �cmd� var 

	if (strcasecmp(cmd, "?") == 0) {                        //if the command is: ?  
		explain_commands();									//call function: "explain_commands"
	}
	if (strcmp(cmd, "i") == 0) {                            //if the command is: i  
		info();                                             //call function:"info"
	}
	if (strcmp(cmd, "adr") == 0) {                          //if the command is: adr
		adress_con();                                       //call function:"adress_con"
	}
	if (strcmp(cmd, "int") == 0) {                          //if the command is: int 
		int_con();                                          //call function:"int_con"
	}
	if (strcmp(cmd, "led") == 0) {                          //if the command is: led
		led_con();                                          //call function:"led_con"
	}
	if ((strcmp(cmd, "on") == 0) || (strcmp(cmd, "off") == 0)) {//if the command is: on or off
		active_con();                                       //call function:"active_con"
	}
	if (strcmp(cmd, "nra") == 0) {                          //if the command is: nra
		nra();                                               //call function:"nra"
	}	
	if (strcmp(cmd, "cal") == 0) {                          //if the command is: cal
		calibration();                                      //call function:"calibration"
	}
	if (strcmp(cmd, "r") == 0) {                            //if the command is: r

		if (strcmp(data_byte_1, "1") == 0) {                //if the command is: r,1
			continuous_mode = 1;                            //set the var continuous_mode = 1 
			Serial.println("continuous mode on");
		}
		if (strcmp(data_byte_1, "0") == 0) {                //if the command is: r,0
			continuous_mode = 0;                            //set the var continuous_mode = 0
			Serial.println("continuous mode off");
		}
		reading();											//call function:"reading" 
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void explain_commands() {                               //if the command is: ? a list of all possible commands will be printed  

	Serial.println(F("**commands are not case sensitive**"));
	Serial.println();
	Serial.println(F("i = deice type and version number"));
	Serial.println();
	Serial.println(F("adr,? = what is the I2C ID number"));
	Serial.println(F("adr,unlock = unlock the I2C address change register"));
	Serial.println(F("adr,lock = Lock the address change register"));
	Serial.println(F("adr,new,[new i2c address number]"));
	Serial.println();
	Serial.println(F("int,? =  read the state of the interrupt control register"));
	Serial.println(F("int,[high],[low],[inv],[off] = set the interrupt control register"));
	Serial.println();
	Serial.println(F("led,? = read the state of the LED control register"));
	Serial.println(F("led,[on],[off] = set the LED control register"));
	Serial.println();
	Serial.println(F("on = start taking readings"));
	Serial.println(F("off = stop taking readings; hibernate"));
	Serial.println();
	Serial.println(F("nra,? = read the state of the new reading available register"));
	Serial.println(F("nra,clr = clear the new reading available register"));
	Serial.println();
	Serial.println(F("cal,? = read the state of the calibration register"));
	Serial.println(F("cal,XXX.X = calibrate to any temperature"));
	Serial.println(F("cal,clr = clear the calibration"));
	Serial.println();
	Serial.println(F("r = take a single TMP reading "));
	Serial.println(F("r,1 = take continuous readings"));
	Serial.println(F("r,0 = END continuous readings"));
}
//*************************************************************************************************************************
//*************************************************************************************************************************
void info() {													//if the command is: i
	const byte device_type_register = 0x00;                     //register to read from 


	i2c_read(device_type_register, two_byte_read);              //I2C_read(OEM register, number of bytes to read)   

	Serial.print("device:");
	Serial.println(move_data.i2c_data[1]);                      //print info from register 0x01
	Serial.print("version:");
	Serial.println(move_data.i2c_data[0]);                      //print info from register 0x00
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void adress_con() {													//if the command is: adr
																	//adr,? = read the I2C bus address
																	//adr,unlock = unlock bus address registers
																	//adr,lock = lock the bus address registers
																	//adr,new,XXX = change the devices bus address (after device has been unlocked)

	byte new_i2c_address;											//used to hold a new bus address
	const byte address_lock = 0x00;									//used to lock the new bus address register 
	const byte address_unlock_A = 0x55;								//first part of the unlock code
	const byte address_unlock_B = 0xAA;								//second part of the unlock code
	const byte address_lock_register = 0x02;						//register to read / write 
	const byte new_address_register = 0x03;							//register to read / write 


	if (strcmp(data_byte_1, "?") == 0) {							//if the command sent was:  
		i2c_read(new_address_register, one_byte_read);				//I2C_read(OEM register, number of bytes to read) 
		Serial.print("SMBus/I2C bus_address:");
		Serial.println(move_data.i2c_data[0]);						//print info from register 0x03
	}

	if (strcmp(data_byte_1, "unlock") == 0) {						//if the command sent was: "adr,unlock"
		i2c_write_byte(address_lock_register, address_unlock_A);    //write the fist part of the unlock command(0x55) to register 0x02 
		i2c_write_byte(address_lock_register, address_unlock_B);    //write the fist part of the unlock command(0xAA) to register 0x02 
		i2c_read(address_lock_register, one_byte_read);             //read from the lock / unlock register to confirm it is unlocked 
		if (move_data.i2c_data[0] == 0)Serial.println("unlocked");  //if the lock/unlock register is unlocked print "unlocked"
	}

	if (strcmp(data_byte_1, "lock") == 0) {                         //if the command sent was: "adr,lock"
		i2c_write_byte(address_lock_register, address_lock);		//write the address lock command to register 0x02  
		i2c_read(address_lock_register, one_byte_read);				//read from the lock / unlock register to confirm it is locked 
		if (move_data.i2c_data[0])Serial.println("locked");			//if the lock/unlock register is locked print "locked"
	}

	if (strcmp(data_byte_1, "new") == 0) {														//if the command sent was: "adr,new,xxx" (where xxx is the new I2C address number
		new_i2c_address = atoi(data_byte_2);													//convert the new address number from a string to an int
		if (new_i2c_address < 1 || new_i2c_address > 127)Serial.println("out of range");		//if the number entered is 0 or >127 "out of range"   
		else																					//however, if the number entered for a new I2c buss address is within range, lets do it
		{
			i2c_read(address_lock_register, one_byte_read);										//call function on line: xxx to make sure the I2C address register is unlocked 
			if (move_data.i2c_data[0])Serial.println("unlock register first");                  //if the I2C address address register is locked "unlock register first" 
			if (move_data.i2c_data[0] == 0) {                                                   //if the I2C address address register is unlocked
				i2c_write_byte(new_address_register, new_i2c_address);							//write the new I2C address to register 0x03
				bus_address = new_i2c_address;													//update this code with the new I2C address                
				Serial.print("adress changed to:");												//print the new I2C address                 
				Serial.println(bus_address);
			}
		}
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void int_con() {                                                                 //if the command is: int                                 
																				 //int,? = read the state of the interrupt control register
																				 //int,[high],[low],[inv],[off] = set the interrupt control register 

	const byte interrupt_control_register = 0x04;                                    //register to read / write
	const byte interrupt_control_off = 0x00;                                         //turn interrupt pin off                                   
	const byte interrupt_control_high = 0x02;                                        //interrupt pin high on new reading(not self resetting)
	const byte interrupt_control_low = 0x04;                                         //interrupt pin low on new reading(not self resetting) 
	const byte interrupt_control_invert = 0x08;                                      //interrupt pin high/low on new reading(this is self resetting) 


	if (strcmp(data_byte_1, "?") == 0) {                                           //if the command sent was: "int,?"
		i2c_read(interrupt_control_register, one_byte_read);                         //I2C_read(OEM register, number of bytes to read)
		Serial.print("Interrupt control register:");
		Serial.println(move_data.i2c_data[0]);                                       //print info from register 0x04                         
	}

	if (strcmp(data_byte_1, "high") == 0) {                                        //if the command sent was:"int,high"
		i2c_write_byte(interrupt_control_register, interrupt_control_high);          //write the interrupt high on new reading command to register 0x04 
		i2c_read(interrupt_control_register, one_byte_read);                         //read from the interrupt control register to confirm it is set correctly   
		if (move_data.i2c_data[0] == 2)Serial.println("*ok, pin high on new reading");
	}

	if (strcmp(data_byte_1, "low") == 0) {                                         //if the command sent was: "int,low"
		i2c_write_byte(interrupt_control_register, interrupt_control_low);           //write the interrupt low on new reading command to register 0x04
		i2c_read(interrupt_control_register, one_byte_read);                         //read from the interrupt control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 4)Serial.println("*ok, pin low on new reading");
	}


	if (strcmp(data_byte_1, "inv") == 0) {                                         //if the command sent was: "int,inv" 
		i2c_write_byte(interrupt_control_register, interrupt_control_invert);        //write the interrupt inverts on new reading command to register 0x04  
		i2c_read(interrupt_control_register, one_byte_read);                         //read from the interrupt control register to confirm it is set correctly  
		if (move_data.i2c_data[0] == 8)Serial.println("*ok, pin invert on new reading");
	}

	if (strcmp(data_byte_1, "off") == 0) {                                         //if the command sent was: "int,off"
		i2c_write_byte(interrupt_control_register, interrupt_control_off);           //write the interrupt off command to register 0x04   
		i2c_read(interrupt_control_register, one_byte_read);                         //read from the interrupt control register to confirm it is set correctly   
		if (move_data.i2c_data[0] == 0)Serial.println("*ok, interrupt off");
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void led_con() {													//if the command is: led                                    
																	//led,? = read the state of the LED control register
																	//led,[on],[off] = Turn the LED on / off

	const byte led_control_register = 0x05;                         //register to read / write
	const byte led_control_on = 0x01;                               //led on
	const byte led_control_off = 0x00;                              //led off


	if (strcmp(data_byte_1, "?") == 0) {							//if the command sent was: "led,?"
		Serial.print("LED= ");
		i2c_read(led_control_register, one_byte_read);              //I2C_read(OEM register, number of bytes to read)                   
		if (move_data.i2c_data[0])Serial.println("on");             //print info from register 0x05  
		if (move_data.i2c_data[0] == 0)Serial.println("off");       //print info from register 0x05
	}

	if (strcmp(data_byte_1, "on") == 0) {							//if the command sent was: "led,on"
		i2c_write_byte(led_control_register, led_control_on);       //write the led on command
		i2c_read(led_control_register, one_byte_read);              //read from the led control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 1)Serial.println("*LED ON");
	}

	if (strcmp(data_byte_1, "off") == 0) {							//if the command sent was: "led,off"
		i2c_write_byte(led_control_register, led_control_off);      //write the led off command
		i2c_read(led_control_register, one_byte_read);              //read from the led control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 0)Serial.println("*LED off");
	}

}
//*************************************************************************************************************************
//*************************************************************************************************************************

void active_con() {													//if the command is: act
																	//act,? = read the state of the active / hibernate control register
																	//act,[on],[off] = take readings  


	const byte active_hibernate_register = 0x06;                    //register to read / write
	const byte active_mode = 0x01;                                  //take readings
	const byte hibernate_mode = 0x00;                               //stop taking readings

	if (strcmp(cmd, "on") == 0) {									//if the command sent was: "on"
		i2c_write_byte(active_hibernate_register, active_mode);     //write the active mode enable command
		i2c_read(active_hibernate_register, one_byte_read);         //read from the active / hibernate control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 1)Serial.println("active");
	}

	if (strcmp(cmd, "off") == 0) {									//if the command sent was: "off"
		i2c_write_byte(active_hibernate_register, hibernate_mode);  //write the active mode disable command
		i2c_read(active_hibernate_register, one_byte_read);			//read from the active / hibernate control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 0)Serial.println("hibernate");
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void nra() {															//if the command is: nra
																		//nra,? = read the state of the new reading available register
																		//nra,clr = clear the new reading available register                            

	const byte new_reading_register = 0x07;								//register to read / write
	const byte reg_clr = 0x00;											//clear reading available register 


	if (strcmp(data_byte_1, "?") == 0) {								//if the command sent was: "nra,?"
		Serial.print("new reading available: ");
		i2c_read(new_reading_register, one_byte_read);					//I2C_read(OEM register, number of bytes to read) 
		if (move_data.i2c_data[0])Serial.println("yes");				//print info from register 0x07
		if (move_data.i2c_data[0] == 0)Serial.println("no");			//print info from register 0x07
	}

	if (strcmp(data_byte_1, "clr") == 0) i2c_write_byte(new_reading_register, reg_clr); //if the command sent was: "nra,clr" clear the new reading available register     
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void calibration() {													//if the command is: cal
																		//cal,? = read the state of the calibration control register
																		//cal,XXX.X = calibrate to any temperature 
																		//cal,clr = clear the calibration

	const byte calibration_value_register = 0x08;						//register to read / write
	const byte calibration_request_register = 0x0C;						//register to read / write
	const byte calibration_confirmation_register = 0x0D;                //register to read
	const byte cal_clear = 0x01;                                        //clear calibration
	const byte calibrate = 0x02;										//calibrate to value
	float calibration = 0;                                              //used to hold the new calibration value 


	if (strcmp(data_byte_1, "?") == 0) {								//if the command sent was: "cal,?"
		Serial.print("calibration status: ");
		i2c_read(calibration_confirmation_register, one_byte_read);     //I2C_read(OEM register, number of bytes to read) and print calibration state
		if (move_data.i2c_data[0] == 0)Serial.println("no calibration");
		if (move_data.i2c_data[0] == 1)Serial.println("calibrated");
	}

	if (strcmp(data_byte_1, "clr") == 0) {								//if the command sent was: "cal,clr"
		i2c_write_byte(calibration_request_register, cal_clear);		//write the calibration clear command to the calibration control register  
		delay(40);														//wait for the calibration event to finish
		i2c_read(calibration_confirmation_register, one_byte_read);		//read from the calibration control register to confirm it is set correctly 
		if (move_data.i2c_data[0] == 0)Serial.println("calibration cleard 0");
	}

	if (isdigit(computerdata[5])) {				                        //if the command sent was: "cal,xxxx" where x is a digit
		calibration = atof(data_byte_1);								//convert the calibration value entered from a string to a float
		calibration *= 1000;											//multiply by 1,000 to remove the decimal point		
		move_data.answ = calibration;									//move the float to a long 
		i2c_write_long(calibration_value_register, move_data.answ);		//write the 4 bytes of the long to the calibration register  
		i2c_write_byte(calibration_request_register, calibrate);		//write the calibration command to the calibration control register  
		delay(10);														//wait for the calibration event to finish 
		i2c_read(calibration_confirmation_register, one_byte_read);		//read from the calibration control register to confirm it is set correctly
		if (move_data.i2c_data[0] == 1) Serial.println("calibrated");
	}
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void reading() {													//if the command is: r
																	//r = take a single
																	//r,1 = take a reading one after the other **interrupt control must be set to "inv" first
																	//r,0 = stop taking readings one after the other    

	const byte RTD_register = 0x0E;									//register to read
	float RTD = 0;													//used to hold the new RTD value

	i2c_read(RTD_register, four_byte_read);							//I2C_read(OEM register, number of bytes to read)                   
	RTD = move_data.answ;											//move the 4 bytes read into a float
	RTD /= 1000;														//divide by 100 to get the decimal point 
	Serial.print("RTD= ");
	Serial.println(RTD, 3);	                                        //print info from register block
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void i2c_read(byte reg, byte number_of_bytes_to_read) {												//used to read 1,2,and 4 bytes: i2c_read(starting register,number of bytes to read)    

	byte i;																							//counter

	Wire.beginTransmission(bus_address);															//call the device by its ID number
	Wire.write(reg);																				//transmit the register that we will start from
	Wire.endTransmission();																			//end the I2C data transmission
	Wire.requestFrom(bus_address, (byte)number_of_bytes_to_read);									//call the device and request to read X bytes
	for (i = number_of_bytes_to_read; i>0; i--) { move_data.i2c_data[i - 1] = Wire.read(); }        //with this code we read multiple bytes in reverse
	Wire.endTransmission();																			//end the I2C data transmission  
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void i2c_write_byte(byte reg, byte data) {															//used to write a single byte to a register: i2c_write_byte(register to write to, byte data) 

	Wire.beginTransmission(bus_address);															//call the device by its ID number
	Wire.write(reg);																				//transmit the register that we will start from
	Wire.write(data);																				//write the byte to be written to the register 
	Wire.endTransmission();																			//end the I2C data transmission
}
//*************************************************************************************************************************
//*************************************************************************************************************************

void i2c_write_long(byte reg, long data) {															//used to write a 4 bytes to a register: i2c_write_long(register to start at, long data )                     

	int i;                                                                                          //counter

	Wire.beginTransmission(bus_address);															//call the device by its ID number
	Wire.write(reg);																				//transmit the register that we will start from
	for (i = 3; i >= 0; i--) {																		//with this code we write multiple bytes in reverse
		Wire.write(move_data.i2c_data[i]);
	}
	Wire.endTransmission();					                                                         //end the I2C data transmission
}
//*************************************************************************************************************************
//*************************************************************************************************************************









