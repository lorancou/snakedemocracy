function vec2(x, y)
{
    // https://gist.github.com/1173137
    this.x = x || 0;
    this.y = y || 0;
    this.clone = function() { return new vec2(this.x, this.y); }
    this.normalize = function()
    {
        var l = this.length();
        this.x = this.x/l;
        this.y = this.y/l;
        return this;
    }
    this.length= function()
    {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
}
vec2.add = function(v1, v2) { return new vec2(v1.x + v2.x, v1.y + v2.y); }
vec2.mul = function(scalar, v2) { return new vec2(scalar*v2.x, scalar*v2.y); }
vec2.sub = function(v1, v2) { return new vec2(v1.x - v2.x, v1.y - v2.y); }
vec2.dot = function(v1, v2) { return v1.x*v2.x +  v1.y*v2.y; }
