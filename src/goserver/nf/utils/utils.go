/**
 * Created by nazarigonzalez on 13/10/16.
 */

package utils

import (
	"encoding/binary"
	"errors"
	"math"
)

const (
	DEG_TO_RAD = math.Pi / 180
	RAD_TO_DEG = 180 / math.Pi
)

func BufferFromString(str string) []byte {
	llen := UnicodeLen(str)

	buff := []byte{
		byte(llen >> 8 & 0xff),
		byte(llen >> 0 & 0xff),
	}

	for _, v := range str {
		buff = append(buff, byte(v>>8&0xff), byte(v>>0&0xff))
	}

	return buff
}

func StringFromBuffer(buff []byte) (string, error) {
	l := int(buff[0])<<8 | int(buff[1])<<0
	return StringFromBufferLen(buff[2:], l)
}

func StringFromBufferLen(buff []byte, l int) (string, error) {
	var str string
	var n int

	if len(buff) < l {
		return "", errors.New("Invalid buffer length.")
	}

	for i := 0; i < l; i++ {
		n = i * 2
		str += string(buff[n]<<8 | buff[n+1]<<0)
	}

	return str, nil
}

func Float32frombytes(bytes []byte) float32 {
	bits := binary.BigEndian.Uint32(bytes)
	float := math.Float32frombits(bits)
	return float
}

func Float32bytes(float float64) []byte {
	bits := math.Float32bits(float32(float))
	bytes := make([]byte, 4)
	binary.BigEndian.PutUint32(bytes, bits)
	return bytes
}

func IntFromInt16Buffer(bytes []byte) int {
	return (((int(bytes[0]) << 8) | (int(bytes[1]) & 0xff)) << 16 >> 16)
}

func UnicodeLen(s string) int {
	return len([]rune(s))
}
