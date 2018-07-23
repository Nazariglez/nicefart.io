/**
 * Created by nazarigonzalez on 11/10/16.
 */

package game

import "math"

type Point struct {
	X, Y float64
}

func (p *Point) Clone() Point {
	return Point{
		X: p.X,
		Y: p.Y,
	}
}

func (p *Point) Copy(p2 *Point) {
	p.X = p2.X
	p.Y = p2.Y
}

func (p *Point) Equals(p2 *Point) bool {
	return p.X == p2.X && p.Y == p2.Y
}

func (p *Point) Set(x, y float64) {
	p.X = x
	p.Y = y
}

func (p *Point) Angle(p2 *Point) float64 {
	return math.Atan2(p2.Y-p.Y, p2.X-p.X)
}

func (p *Point) Distance(p2 *Point) float64 {
	x := p.X - p2.X
	y := p.Y - p2.Y
	return math.Sqrt(x*x + y*y)
}
