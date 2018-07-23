// Created by nazarigonzalez on 26/2/17.

package logger

import (
	"io"
	"log"
	"os"
	"runtime"
	"strconv"
	"sync"
)

type LogLevel int

const (
	TraceLevel LogLevel = iota
	DebugLevel
	InfoLevel
	WarnLevel
	ErrorLevel
)

var level = InfoLevel
var flags = log.Flags()
var mu = sync.Mutex{}

var ch = make(chan func())
var initiated = false

var traceLog, debugLog, infoLog, warnLog, errorLog, fatalLog *log.Logger

func Init(file, name string) {
	if initiated {
		Info("Logger already initiated.")
		return
	}

	initiated = true
	logFile, err := os.OpenFile(file, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0640)
	if err != nil {
		log.Fatal(err)
	}

	writer := io.MultiWriter(logFile, os.Stdout)
	writerErr := io.MultiWriter(logFile, os.Stderr)

	n := "[" + name + "] "

	traceLog = log.New(writer, n+"\033[35mTrace:\033[39m ", flags)
	debugLog = log.New(writer, n+"\033[96mDebug:\033[39m ", flags)
	infoLog = log.New(writer, n+"\033[32mInfo:\033[39m  ", flags)
	warnLog = log.New(writer, n+"\033[93mWarn:\033[39m  ", flags)
	errorLog = log.New(writerErr, n+"\033[31mError:\033[39m ", flags)
	fatalLog = log.New(writerErr, n+"\033[0;41mFatal:\033[0;39m ", flags)

	go readEvents()
}

func readEvents() {
	for f := range ch {
		mu.Lock()
		f()
		mu.Unlock()
	}
}

func SetLevel(l LogLevel) {
	if !initiated {
		level = l
		return
	}

	mu.Lock()
	level = l
	mu.Unlock()
}

func Level() LogLevel {
	mu.Lock()
	defer mu.Unlock()
	return level
}

func isLevel(l LogLevel) bool {
	return level <= l
}

func isLevelProtected(l LogLevel) bool {
	return Level() <= l
}

func Trace(args ...interface{}) {
	if !isLevelProtected(TraceLevel) {
		return
	}

	_, fn, line, _ := runtime.Caller(1)

	ch <- func() {
		args = append(args, "["+fn+":"+strconv.Itoa(line)+"]")
		traceLog.Println(args...)
	}
}

func Tracef(format string, v ...interface{}) {
	if !isLevelProtected(TraceLevel) {
		return
	}

	_, fn, line, _ := runtime.Caller(1)

	ch <- func() {
		traceLog.Printf(format+" ["+fn+":"+strconv.Itoa(line)+"]", v...)
	}
}

func Debug(args ...interface{}) {
	ch <- func() {
		if !isLevel(DebugLevel) {
			return
		}
		debugLog.Println(args...)
	}
}

func Debugf(format string, v ...interface{}) {
	ch <- func() {
		if !isLevel(DebugLevel) {
			return
		}
		debugLog.Printf(format, v...)
	}
}

func Info(args ...interface{}) {
	ch <- func() {
		if !isLevel(InfoLevel) {
			return
		}
		infoLog.Println(args...)
	}
}

func Infof(format string, v ...interface{}) {
	ch <- func() {
		if !isLevel(InfoLevel) {
			return
		}
		infoLog.Printf(format, v...)
	}
}

func Warn(args ...interface{}) {
	ch <- func() {
		if !isLevel(WarnLevel) {
			return
		}
		warnLog.Println(args...)
	}
}

func Warnf(format string, v ...interface{}) {
	ch <- func() {
		if !isLevel(WarnLevel) {
			return
		}
		warnLog.Printf(format, v...)
	}
}

func Error(args ...interface{}) {
	ch <- func() {
		if !isLevel(ErrorLevel) {
			return
		}
		errorLog.Println(args...)
	}
}

func Errorf(format string, v ...interface{}) {
	ch <- func() {
		if !isLevel(ErrorLevel) {
			return
		}
		errorLog.Printf(format, v...)
	}
}

func Fatal(args ...interface{}) {
	ch <- func() {
		fatalLog.Fatal(args...)
	}
}

func Fatalf(format string, v ...interface{}) {
	ch <- func() {
		fatalLog.Fatalf(format, v...)
	}
}
